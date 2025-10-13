"use client";

import { Source_Code_Pro } from 'next/font/google';
import { redirect, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import getUser from '@/lib/auth/user';
import LayoutHeader from './header';
import LayoutSidebar from './sidebar';
import { CodeBlock } from '../tutorial/code-block';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { User } from '@/lib/types/user';

const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], weight: '400', variable: '--font-source-code-pro' });


export type DefaultLayoutProps = {
    setUser?: (user: User | null) => void;
    shouldRequireUser?: boolean;
    hideSidebar? : boolean;
    hideHeader? : boolean;
    userData?: (user: User) => void;
    children: React.ReactNode;
};

export default function DefaultLayout({ shouldRequireUser, hideSidebar, hideHeader, userData, children }: DefaultLayoutProps) {

    const pathname = usePathname(); 
    const [user, setUser] = useState<User | null>(null);

    const setUserState = async () => {
    
        const user = await getUser();
        setUser(user);

        if (shouldRequireUser && !user) {
            redirect('/auth/login');
        }

        if(user && (!user.profile && !pathname.startsWith('/profile'))) {
            redirect('/profile?required=true');
        }

        if (userData && user) {
            userData(user);
        }
    }

    useEffect(() => {
        setUserState();
    }, [pathname]);

    return <div className={`${sourceCodePro.className} min-h-screen flex`}>
        {/* Sidebar */}
        {!hideSidebar && <LayoutSidebar />}

        {/* Main Content Area */}
        <div className="flex-grow">
            <div className="p-4">
                {/* Header Area */}
                {!hideHeader && <LayoutHeader user={user} />}

                {/* Page Content */}
                <div className="w-full text-black rounded-2xl">
                    {children}


                    <div className="w-full bg-red-100 p-4 border-red-500 rounded-2xl mt-8">
                        <Collapsible>

                            <CollapsibleTrigger className="cursor-pointer">User Data</CollapsibleTrigger>
                            <CollapsibleContent>
                                <CodeBlock code={JSON.stringify(user, null, 2)} />
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>
            </div>
        </div>
    </div>;
}