import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { motion } from "framer-motion";

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen relative isolate">
            {/* Background image */}
            <div className="absolute inset-0 -z-10">
                <img 
                    src="/фон2.png" 
                    alt="Фоновое изображение" 
                    className="h-full w-full object-cover brightness-50"
                />
            </div>

            {/* Header */}
            <div className="absolute inset-x-0 top-0 z-50">
                <div className="flex justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link href="/" className="text-3xl font-bold text-white hover:text-blue-400 transition-colors">
                            Бизнес Платформа
                        </Link>
                    </motion.div>
                </div>
            </div>

            <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-32 w-full overflow-hidden bg-white/10 backdrop-blur-md px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg border border-white/20"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
