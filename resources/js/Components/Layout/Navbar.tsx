import React from "react";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/Components/ui/menubar";
import { Button } from "@/Components/ui/button";
import { Search, Bell } from "lucide-react";

interface NavbarProps {
    triggerSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ triggerSearch }) => {
    return (
        <Menubar className="border-b rounded-none px-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={triggerSearch}
                >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Поиск</span>
                </Button>
            </div>
            <MenubarSeparator />
            <MenubarMenu>
                <MenubarTrigger>Файл</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>Создать</MenubarItem>
                    <MenubarItem>Открыть</MenubarItem>
                    <MenubarItem>Сохранить</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Правка</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>Копировать</MenubarItem>
                    <MenubarItem>Вставить</MenubarItem>
                    <MenubarItem>Вырезать</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <div className="ml-auto flex items-center">
                <Button variant="ghost" size="icon">
                    <Bell className="h-4 w-4" />
                </Button>
            </div>
        </Menubar>
    );
};

export default Navbar;