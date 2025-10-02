import {
  BookOpen,
  School,
  Settings,
  Users,
  FileText,
  BarChart,
  Calendar,
  type LucideIcon,
  LayoutDashboard,
  FolderOpen,
  Medal,
} from 'lucide-vue-next'

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  badge?: string | number
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

export type RoleNavigation = {
  [key in 'student' | 'teacher' | 'admin']: NavGroup[]
}

export const roleNavigation: RoleNavigation = {
  student: [
    {
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Practice',
          url: '/practice',
          icon: FileText,
        },
        {
          title: 'My Courses',
          url: '/courses',
          icon: BookOpen,
        },
        {
          title: 'Assignments',
          url: '/assignments',
          icon: FileText,
          badge: 3,
        },
        {
          title: 'Achievements',
          url: '/achievements',
          icon: Medal,
        },
        {
          title: 'Calendar',
          url: '/calendar',
          icon: Calendar,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
  teacher: [
    {
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Questions',
          url: '/questions',
          icon: FileText,
        },
        {
          title: 'Question Sets',
          url: '/question-sets',
          icon: FolderOpen,
        },
        {
          title: 'Students',
          url: '/students',
          icon: Users,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: BarChart,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
  admin: [
    {
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Classes',
          url: '/classes',
          icon: School,
        },
        {
          title: 'Courses',
          url: '/courses',
          icon: BookOpen,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: BarChart,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
