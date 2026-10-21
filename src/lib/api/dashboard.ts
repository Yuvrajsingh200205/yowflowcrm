import { apiRequest } from './client';

export interface DashboardSummary {
  stats: {
    projects: number;
    activeProjects: number;
    completedProjects: number;
    urgentProjects: number;
    shoots: number;
    upcomingShoots: number;
    tasks: number;
    openTasks: number;
    overdueTasks: number;
    todos: number;
    pendingTodos: number;
    teamMembers: number;
    unreadNotifications: number;
    presentToday: number;
  };
  projectsByStatus: Record<string, number>;
  finance: { received: number; quoted: number; outstanding: number } | null;
  attendance: {
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    date: string;
  } | null;
  upcomingShoots: {
    id: string;
    title: string;
    shootDate: string;
    startTime: string | null;
    status: string;
    location: string | null;
    projectName: string;
    projectNumber: string;
    clientName: string;
    eventName: string | null;
    crew: { role: string; name: string | null }[];
  }[];
  urgentProjects: {
    id: string;
    projectNumber: string;
    name: string;
    status: string;
    weddingDate: string | null;
    deliveryDueDate: string | null;
  }[];
}

export interface DashboardTrends {
  months: string[];
  revenue: number[] | null;
  expenses: number[] | null;
  leads: number[];
  bookings: number[];
}

export const dashboardApi = {
  async trends(months = 8): Promise<DashboardTrends> {
    const { data } = await apiRequest<DashboardTrends>(`/dashboard/trends?months=${months}`);
    return data;
  },
  async summary(): Promise<DashboardSummary> {
    const { data } = await apiRequest<DashboardSummary>('/dashboard/summary');
    return data;
  },
};
