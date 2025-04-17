import { Link } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { motion } from "framer-motion";

interface Props {
  canLogin: boolean;
  canRegister: boolean;
  laravelVersion: string;
  phpVersion: string;
}

export default function Welcome({ canLogin, canRegister }: Props) {
  return (
    <div className="relative isolate min-h-screen">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img 
          src="/фон1.png" 
          alt="Фоновое изображение" 
          className="h-full w-full object-cover brightness-50"
        />
      </div>

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50 bg-black/10 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex lg:flex-1"
          >
            <Link href="/" className="-m-1.5 p-1.5 text-white font-semibold text-xl">
              Бизнес Платформа
            </Link>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex gap-4"
          >
            {canLogin ? (
              <div className="flex items-center gap-x-2">
                <Link href={route('login')}>
                  <Button variant="ghost" className="text-white hover:text-gray-300 hover:bg-white/10">
                    Войти
                  </Button>
                </Link>
                {canRegister && (
                  <Link href={route('register')}>
                    <Button variant="secondary" className="text-gray-900">
                      Регистрация
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-x-2">
                <Link href={route('profile.edit')}>
                  <Button variant="ghost" className="text-white hover:text-gray-300 hover:bg-white/10">
                    Личный кабинет
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative px-6 lg:px-8 min-h-screen flex items-center">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-4">
            Единая платформа для управления вашей компанией
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Объединяет задачи, коммуникации и управление командой в одном удобном интерфейсе. Оптимизируйте рабочие процессы и повысьте эффективность вашего бизнеса.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href={route('register')}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
                  Начать работу
                </Button>
              </Link>
              <Link href="#features" className="text-sm font-semibold leading-6 text-white group transition duration-300">
                Узнать больше{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="bg-white py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl lg:text-center"
          >
            <h2 className="text-base font-semibold leading-7 text-blue-600">
              Возможности платформы
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Все необходимое для управления бизнесом
            </p>
          </motion.div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  title: "Управление командой",
                  description: "Гибкая система ролей и прав доступа, управление группами пользователей и эффективная организация рабочих процессов.",
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Задачи и проекты",
                  description: "Создавайте, назначайте и отслеживайте задачи. Установка дедлайнов, прикрепление файлов и умные напоминания.",
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Коммуникация",
                  description: "Встроенные чаты, групповые обсуждения и видеозвонки. Удобный обмен файлами и информацией внутри команды.",
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  ),
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col group hover:scale-105 transition-transform duration-300"
                >
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <div className="flex-auto">
                    <h3 className="text-xl font-semibold leading-7 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
