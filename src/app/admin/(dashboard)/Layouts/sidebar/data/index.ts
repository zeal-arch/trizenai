import {
  HomeIcon,
  AppointmentsIcon,
  BlogIcon,
  AboutUsIcon,
  User,
} from "@/admin/assets/icons";

export type SubItem = {
  title: string;
  url: string;
};

export type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SubItem[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_DATA: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: HomeIcon,
        items: [],
      },
    ],
  },
  {
    label: "EVENT MANAGEMENT",
    items: [
      {
        title: "Events",
        url: "/admin/events",
        icon: AppointmentsIcon,
        items: [
          { title: "All Events", url: "/admin/events" },
          { title: "Create Event", url: "/admin/events/new" },
        ],
      },
      {
        title: "Customer Galleries",
        url: "/admin/galleries",
        icon: BlogIcon,
        items: [],
      },
    ],
  },
  {
    label: "TEAM & COLLABORATION",
    items: [
      {
        title: "Team Members",
        url: "/admin/team",
        icon: AboutUsIcon,
        items: [],
      },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      {
        title: "Profile",
        url: "/admin/profile",
        icon: User,
        items: [],
      },
    ],
  },
];
