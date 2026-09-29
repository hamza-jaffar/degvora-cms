import Heading from "@/components/heading";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Form } from "@inertiajs/react";

const CreateUser = () => {
    return (
        <div className="p-8 max-w-5xl w-full mx-auto">
            <Form>
                {({ errors, processing }) => (
                    <>
                        <div className="flex justify-between w-full ">
                            <Heading
                                title="User Management"
                                description="Manage user profiles, roles, and permissions across your organization."
                            />
                            <Button className="cursor-pointer">
                                {processing ? (
                                    <>
                                        <Spinner /> Creating...
                                    </>
                                ) : (
                                    "Create"
                                )}
                            </Button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="profile_pic">Profile Pic</Label>
                                <Input
                                    type="file"
                                    name="profile_pic"
                                    id="profile_pic"
                                />
                                <InputError message={errors.profile_pic} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input name="name" id="name" />
                                <InputError message={errors.name} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input name="email" id="email" />
                                <InputError message={errors.email} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    type="password"
                                    name="password"
                                    id="password"
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password_confirmation">Password Confirmation</Label>
                                <Input
                                    type="password"
                                    name="password"
                                    id="password_confirmation"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
};

export default CreateUser;
