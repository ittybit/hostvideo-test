"use client";

import DefaultLayout from "@/components/layout/default";
import { useEffect, useState } from "react";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {

    const [required, setRequired] = useState(false);

    useEffect(() => {
        setRequired(new URLSearchParams(window.location.search).get('required') === 'true');
    }, []);

    return <DefaultLayout hideHeader={required} hideSidebar={required} shouldRequireUser={true}>
        {children}
    </DefaultLayout>;
}
