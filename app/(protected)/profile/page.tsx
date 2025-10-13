"use client";

import LayoutSection from "@/components/layout/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import getUser, { updateUserProfile } from "@/lib/auth/user";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { redirect, useSearchParams } from "next/navigation";

function ProfileContent() {
    const searchParams = useSearchParams();
    const required = searchParams.get('required') === 'true';

    const [name, setName] = useState('');
    const [initialName, setInitialName] = useState('');
    const [username, setUsername] = useState('');
    const [initialUsername, setInitialUsername] = useState('');
    const [saving, setSaving] = useState(false);

    const saveProfile = async () => {
        if (saving) return;
        setSaving(true);
        const { success, error } = await updateUserProfile({ name: name.trim(), username: username.trim().toLowerCase() });
        if (success) {
            setInitialName(name.trim());
            setInitialUsername(username.trim().toLowerCase());
            if(required) {
                redirect('/');
            }
        } else {
            alert(error || 'Error saving profile');
        }

        setSaving(false);
    }

    useEffect(() => {
        // Fetch user data and populate state   
        async function fetchUserData() {
            const user = await getUser();
            if (user) {
                setName(user?.profile?.name || '');
                setUsername(user?.profile?.username || '');
                setInitialName(user?.profile?.name || '');
                setInitialUsername(user?.profile?.username || '');
            }
        }
        fetchUserData();
    }, []);



    return (<>
            {required && <div className="mb-8">
                <Alert variant="destructive">
                    <AlertTitle>Complete your profile</AlertTitle>
                    <AlertDescription>
                        You need to set your name and username to continue
                    </AlertDescription>
                </Alert>    
            </div>}
            <LayoutSection>
                <div className="flex">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-4">Profile</h1>
                        <p className="mb-4">Complete your profile to access all features.</p>
                    </div>
                    <div className="">
                        <Button onClick={saveProfile} disabled={saving} variant="positive">
                            {!saving ? 'Save Profile' : <Loader2 className="animate-spin" />}
                        </Button>
                    </div>
                </div>

                <div className="">
                    <div className="">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1" htmlFor="name">
                                Name
                            </label>
                            <Input
                                type="text"
                                id="name"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={name}
                                placeholder={"Your full name"}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="w-4 mb-4" />
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1" htmlFor="username">
                                Username
                            </label>
                            <Input
                                type="text"
                                id="username"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={username}
                                placeholder={"Your username"}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                {/* Profile form or details would go here */}
            </LayoutSection>
        </>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
