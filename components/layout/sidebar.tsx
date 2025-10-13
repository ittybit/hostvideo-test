import { Londrina_Outline } from 'next/font/google';
import {
  BookOpen,
  Clock,
  Video,
  PlaySquare,
  Upload,
  Library,
  History,
  Heart,
  Settings,
  User,
  Share2,
  ChevronDown,
  ChevronRight,
  Folder,
  Star,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import getUser from '@/lib/auth/user';
import LayoutHeader from './header';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';


const londrinaOutline = Londrina_Outline({ subsets: ['latin'], weight: '400' });

interface MenuSection {
    title: string;
    items: MenuItem[];
    collapsible?: boolean;
}

interface MenuItem {
    name: string;
    icon: LucideIcon;
    href: string;
    subItems?: MenuItem[];
}

const menuSections: MenuSection[] = [
    {
        title: "Discover",
        items: [
            {
                name: "Explore",
                icon: Compass,
                href: "/explore"
            },
            {
                name: "Trending",
                icon: Star,
                href: "/trending"
            }
        ]
    },
    {
        title: "Library",
        collapsible: true,
        items: [
            {
                name: "Your Videos",
                icon: Video,
                href: "/videos",
            },
            {
                name: "Playlists",
                icon: PlaySquare,
                href: "/playlists",
                subItems: [
                    {
                        name: "Favorites",
                        icon: Heart,
                        href: "/playlists/favorites"
                    },
                    {
                        name: "Watch Later",
                        icon: Clock,
                        href: "/playlists/watch-later"
                    }
                ]
            },
            {
                name: "Uploads",
                icon: Upload,
                href: "/uploads"
            }
        ]
    },
    {
        title: "Personal",
        collapsible: true,
        items: [
            {
                name: "History",
                icon: History,
                href: "/history"
            },
            {
                name: "Liked Videos",
                icon: Heart,
                href: "/liked"
            },
            {
                name: "Collections",
                icon: Folder,
                href: "/collections"
            }
        ]
    },
    {
        title: "Account",
        items: [
            {
                name: "Profile",
                icon: User,
                href: "/profile"
            },
            {
                name: "Settings",
                icon: Settings,
                href: "/settings"
            },
            {
                name: "Share Profile",
                icon: Share2,
                href: "/share"
            }
        ]
    }
];

const MenuSection = ({ section }: { section: MenuSection }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="mb-6">
            {section.collapsible ? (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center w-full text-sm font-semibold text-gray-500 hover:text-gray-700 mb-2"
                >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="ml-1">{section.title}</span>
                </button>
            ) : (
                <div className="text-sm font-semibold text-gray-500 mb-2 pl-5">
                    {section.title}
                </div>
            )}
            {(!section.collapsible || isOpen) && (
                <div className="space-y-1">
                    {section.items.map((item) => (
                        <MenuItem key={item.href} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

const MenuItem = ({ item }: { item: MenuItem }) => {
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

    return (
        <div>
            <Link
                href={item.href}
                className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            >
                <item.icon size={20} className="text-indigo-500" />
                <span className="ml-3 font-medium">{item.name}</span>
                {item.subItems && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsSubMenuOpen(!isSubMenuOpen);
                        }}
                        className="ml-auto"
                    >
                        {isSubMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}
            </Link>
            {item.subItems && isSubMenuOpen && (
                <div className="ml-6 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                        <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <subItem.icon size={16} className="text-indigo-500" />
                            <span className="ml-3 font-medium">{subItem.name}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

const Logo = ({ fontSize }: { fontSize: string }) => (
    <div className="">
        <Image src="/images/hostvideo-logo-cloud-transparent.svg" alt="Host Video Logo" width={56} height={56} className="mx-auto pt-2 pb-2" />
    </div>
);

export default function LayoutSidebar() {
    return (
        <div className="p-4">
            <div className="bg-white shadow-2xl text-black pt-4 pl-2 pr-2 pb-4 rounded-2xl md:w-[280px]">
                <div className="text-center mb-6">
                    <Logo fontSize="3xl" />
                </div>

                <div className="space-y-2">
                    {menuSections.map((section) => (
                        <MenuSection key={section.title} section={section} />
                    ))}
                </div>
            </div>
        </div>
    );
}