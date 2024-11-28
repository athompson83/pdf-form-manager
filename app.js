// Add this at the beginning of your file
function parseJSONWithComments(jsonString) {
    try {
        // Remove comments and parse JSON
        const strippedJson = stripJsonComments(jsonString);
        return JSON.parse(strippedJson);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
    }
}

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Simple JSON comment stripper
function stripComments(str) {
    return str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').trim();
}

// Parse JSON safely
function safeJSONParse(str) {
    try {
        return JSON.parse(stripComments(str));
    } catch (e) {
        console.error('JSON Parse Error:', e);
        return null;
    }
}

// App state
let currentPdf = null;
let customFields = [];
let currentScale = 1.0;
let isPositioning = false;

// DOM Elements
const uploadBtn = document.getElementById('uploadBtn');
const addFieldBtn = document.getElementById('addFieldBtn');
const saveBtn = document.getElementById('saveBtn');
const pdfViewer = document.getElementById('pdfViewer');
const fieldOverlay = document.getElementById('fieldOverlay');
const fieldList = document.getElementById('fieldList');
const fieldModal = document.getElementById('fieldModal');
const fieldForm = document.getElementById('fieldForm');
const darkModeToggle = document.getElementById('darkModeToggle');

// Dark mode handling
darkModeToggle.addEventListener('change', () => {
    document.documentElement.setAttribute('data-theme', darkModeToggle.checked ? 'dark' : 'light');
});

// File upload handling
uploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await loadPDF(file);
        }
    };
    input.click();
});

// Load and display PDF
async function loadPDF(file) {
    try {
        const fileReader = new FileReader();
        
        fileReader.onload = async function() {
            const typedarray = new Uint8Array(this.result);
            
            // Load the PDF document using PDF.js
            const loadingTask = pdfjsLib.getDocument(typedarray);
            const pdf = await loadingTask.promise;
            currentPdf = pdf;
            
            // Load the first page
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: currentScale });
            
            // Prepare canvas
            const canvas = document.getElementById('pdfViewer');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render PDF page
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Get existing form fields
            const annotations = await page.getAnnotations();
            customFields = annotations
                .filter(annot => annot.subtype === 'Widget')
                .map(field => ({
                    name: field.fieldName || 'Unnamed Field',
                    type: getFieldType(field.fieldType),
                    x: field.rect[0],
                    y: viewport.height - field.rect[1]
                }));
            
            updateFieldList();
            addFieldBtn.disabled = false;
            saveBtn.disabled = false;
        };
        
        fileReader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Error loading PDF:', error);
    }
}

// Get field type from PDF annotation
function getFieldType(fieldType) {
    switch (fieldType) {
        case 'Tx': return 'text';
        case 'Btn': return 'checkbox';
        case 'Ch': return 'dropdown';
        default: return 'text';
    }
}

// Field positioning
pdfViewer.addEventListener('click', (e) => {
    if (!isPositioning) return;
    
    const rect = pdfViewer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    document.getElementById('fieldX').value = x;
    document.getElementById('fieldY').value = y;
    
    // Show position indicator
    const indicator = document.createElement('div');
    indicator.className = 'position-indicator';
    indicator.style.left = x + 'px';
    indicator.style.top = y + 'px';
    fieldOverlay.innerHTML = '';
    fieldOverlay.appendChild(indicator);
    
    isPositioning = false;
    fieldModal.style.display = 'block';
});

// Update field list display
function updateFieldList() {
    fieldList.innerHTML = '';
    customFields.forEach((field, index) => {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'field-item';
        
        // Create field marker on overlay
        const marker = document.createElement('div');
        marker.className = 'field-marker';
        marker.style.left = field.x + 'px';
        marker.style.top = field.y + 'px';
        marker.title = field.name;
        fieldOverlay.appendChild(marker);
        
        // Create field list item
        fieldElement.innerHTML = `
            <span>${field.name} (${field.type})</span>
            <button onclick="removeField(${index})" class="btn secondary small">
                <span class="mdi mdi-delete"></span>
            </button>
        `;
        fieldList.appendChild(fieldElement);
    });
}

// Remove field
function removeField(index) {
    customFields.splice(index, 1);
    updateFieldList();
}

// Field modal handling
addFieldBtn.addEventListener('click', () => {
    isPositioning = true;
    document.body.style.cursor = 'crosshair';
});

function closeFieldModal() {
    fieldModal.style.display = 'none';
    document.body.style.cursor = 'default';
    isPositioning = false;
    fieldForm.reset();
}

// Handle field form submission
fieldForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fieldName = document.getElementById('fieldName').value;
    const fieldType = document.getElementById('fieldType').value;
    const x = parseFloat(document.getElementById('fieldX').value);
    const y = parseFloat(document.getElementById('fieldY').value);
    
    customFields.push({
        name: fieldName,
        type: fieldType,
        x: x,
        y: y
    });
    
    updateFieldList();
    closeFieldModal();
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === fieldModal) {
        closeFieldModal();
    }
};

// Save template to Bubble
saveBtn.addEventListener('click', async () => {
    try {
        // Create preview image
        const canvas = document.getElementById('pdfViewer');
        const previewImage = canvas.toDataURL('image/png');
        
        // Prepare template data
        const templateData = {
            fields: customFields,
            preview: previewImage,
            name: 'Template ' + new Date().toLocaleString()
        };
        
        // Send to Bubble API
        const response = await fetch('https://paramedicine101.bubbleapps.io/version-test/api/1.1/obj/pdf_template', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.BUBBLE_API_KEY
            },
            body: JSON.stringify(templateData)
        });
        
        if (response.ok) {
            alert('Template saved successfully!');
        } else {
            throw new Error('Failed to save template');
        }
    } catch (error) {
        console.error('Error saving template:', error);
        alert('Failed to save template. Please try again.');
    }
});

// Function to strip JSON comments
function stripJsonComments(jsonString) {
    return jsonString.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
}
