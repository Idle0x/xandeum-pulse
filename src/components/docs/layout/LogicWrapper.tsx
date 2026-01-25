import { ReactNode, useRef, useState, useEffect } from 'react';

interface LogicWrapperProps {
    children: ReactNode;
    title: string;
    code: string;
    githubPath: string;
}

export function LogicWrapper({ children, title, code, githubPath }: LogicWrapperProps) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 } // Trigger when 20% of the component is visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="max-w-7xl mx-auto px-6 py-12">
            {children}
            {/* Restored Logic Terminal */}
            <LogicTerminal 
                title={title} 
                code={code} 
                githubPath={githubPath} 
                isVisible={isVisible} 
            />
        </div>
    );
}
