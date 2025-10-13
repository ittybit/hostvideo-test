import { usePathname, redirect } from "next/navigation";
import { HomeIcon, FlameIcon, UploadCloud, ChevronDown, User } from "lucide-react";
import { Input } from "../ui/input";
import Link from "next/link";
import { User as UserType } from '@/lib/types/user';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LayoutHeader({ user }: { user: UserType | null }) {

    const pathname = usePathname();

    return <div className="bg-white w-full text-black p-4 rounded-2xl mb-8 flex shadow-2xl items-center">
            <div className="">
                <Link className={`${pathname === '/' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-black'} p-2 rounded-2xl mr-4 cursor-pointer flex`} href="/">
                    <HomeIcon size={24} className={`${pathname === '/' ? 'text-white' : 'text-indigo-500'}`} />
                </Link>
            </div>
            <div className="">
                <Link className={`${pathname === '/explore' ? 'bg-indigo-500' : 'bg-indigo-100'} text-black p-2 rounded-2xl mr-4 cursor-pointer flex`} href="/explore">
                    <FlameIcon size={24} className={`${pathname === '/explore' ? 'text-indigo-100' : 'text-indigo-500'}`} />
                </Link>
            </div>
            <div className="flex-1">
                <Input type="text" placeholder="Search..." />
            </div>

            {user && (
                <>
                    <div className="">
                        <Link className={`${pathname === "/upload" ? "bg-indigo-500 text-white" : "bg-gray-100 text-indigo-500"} p-2 rounded-2xl ml-4 cursor-pointer flex`} href="/upload">
                            <UploadCloud size={24} className='pt-1' />
                        </Link>
                    </div>
                    <div className="">
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <div className="bg-gray-100 text-black p-2 rounded-2xl ml-4 cursor-pointer flex">
                                    <div className="bg-indigo-500 rounded-full w-6 h-6 "></div>
                                    <div className="pl-1"><ChevronDown size={24} className='pt-1' /></div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>
                                    <span className="font-medium">{user?.profile?.name || 'No Name'}</span>
                                    <br/>
                                    <span className="text-sm text-gray-500">@{user?.profile?.username || 'no-username'}</span>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Link href="/profile" className="w-full h-full">
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </>
            )}

            {!user && (
                <div className="ml-4">
                    <Link href="/auth/login" className="bg-indigo-100 text-indigo-500 px-4 py-2 rounded-2xl cursor-pointer flex">
                        <User size={24} className='' />
                    </Link>
                </div>
            )}
        </div>
}