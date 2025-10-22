import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/lib/auth';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { HRDashboard } from './dashboards/HRDashboard';
import { ManagerDashboard } from './dashboards/ManagerDashboard';
import { EmployeeDashboard } from './dashboards/EmployeeDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'employee':
        return <EmployeeDashboard />;
      default:
        return (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please contact your administrator to assign you a role.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;
