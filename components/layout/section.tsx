export default function LayoutSection({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={`bg-white p-8 rounded-2xl shadow-2xl ${className}`}>
        {children}
    </div>;
}