import {
  HomeIcon,
  AppointmentsIcon,
  BlogIcon,
  AboutUsIcon,
  User,
} from "@/admin/assets/icons";
import type { UserRole } from "@/types";

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

export function getNavData(role: UserRole = "ADMIN"): NavSection[] {
  if (role === "TEAM_MEMBER") {
    return [
      {
        label: "MY WORKSPACE",
        items: [
          {
            title: "Assigned Events",
            url: "/admin/events",
            icon: AppointmentsIcon,
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
  }

  return NAV_DATA;
}

