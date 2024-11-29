import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  VpnKey as VpnKeyIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: 'Template Manager',
      description: 'Upload and manage PDF templates',
      icon: <DescriptionIcon />,
      path: '/templates',
    },
    {
      title: 'API Keys',
      description: 'Manage API keys for Bubble integration',
      icon: <VpnKeyIcon />,
      path: '/api-keys',
    },
    {
      title: 'Activity Logs',
      description: 'View system logs and API activity',
      icon: <AssessmentIcon />,
      path: '/logs',
    },
    ...(user?.role === 'admin'
      ? [
          {
            title: 'User Management',
            description: 'Manage users and permissions',
            icon: <PeopleIcon />,
            path: '/users',
          },
        ]
      : []),
  ];

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ExitToAppIcon />}
            onClick={logout}
          >
            Logout
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3}>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <List>
                  {menuItems.map((item) => (
                    <ListItem
                      button
                      key={item.title}
                      onClick={() => navigate(item.path)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        secondary={item.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3}>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={user?.email}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Role"
                      secondary={user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                    />
                  </ListItem>
                </List>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;
