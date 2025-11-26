import { useAuth } from "../../context/AuthContext";
import DashboardScreen from "../../screens/Dashboard/DashboardScreen";
import TechnicianDashboardScreen from "../../screens/Technician/TechnicianDashboardScreen";

export default function Index() {
  const { user } = useAuth();
  const isTechnician = user?.role === "technician";

  return isTechnician ? <TechnicianDashboardScreen /> : <DashboardScreen />;
}
