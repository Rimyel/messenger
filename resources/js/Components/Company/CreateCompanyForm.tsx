import React, { useState, ChangeEvent, FormEvent } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";
import { CompanyApi } from "@/services/api";
import { useForm } from "@inertiajs/react";

const CreateCompanyForm: React.FC = () => {
    const { data, setData, errors, post, reset, processing } = useForm({
        name: "",
        description: "",
        photo: "",
    });

    const [companyName, setCompanyName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            post(route("company.upload"));
            // const formData = new FormData();
            // formData.append('name', companyName);
            // formData.append('description', description);
            // if (image) {
            //     formData.append('logo', image);
            // }

            // await CompanyApi.create(formData);
            // Очищаем форму после успешного создания
            setCompanyName("");
            setDescription("");
            setImage(null);
            setImagePreview("");
            // Можно добавить уведомление об успешном создании
            console.log("Компания успешно создана");
        } catch (err) {
            setError("Произошла ошибка при создании компании");
            console.error("Ошибка:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full items-center justify-center p-6">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        Создание компании
                    </CardTitle>
                    <CardDescription className="text-center">
                        Заполните информацию о вашей компании
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">
                                Название компании
                            </Label>
                            <Input
                                id="companyName"
                                placeholder="Введите название компании"
                                // value={companyName}
                                // onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                //     setCompanyName(e.target.value)
                                // }
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Описание компании
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Введите описание компании"
                                // value={description}
                                // onChange={(
                                //     e: ChangeEvent<HTMLTextAreaElement>
                                // ) => setDescription(e.target.value)}
                                // rows={4}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Логотип компании</Label>
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-full w-full object-cover rounded-lg"
                                        />
                                    ) : (
                                        <ImagePlus className="h-8 w-8 text-gray-400" />
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        document
                                            .getElementById("image-upload")
                                            ?.click()
                                    }
                                >
                                    Выбрать изображение
                                </Button>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm mb-4">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Создание...
                                </>
                            ) : (
                                "Создать компанию"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateCompanyForm;
