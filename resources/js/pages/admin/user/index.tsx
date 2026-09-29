import Heading from "@/components/heading";
import { Button } from "@/components/ui/button";
import users from "@/routes/admin/users";
import { Link } from "@inertiajs/react";
import { Plus } from "lucide-react";

const UserIndex = () => {
    return (
        <div className="p-8">
            <div className="flex justify-between w-full ">
                <Heading
                    title="User Management"
                    description="Manage user profiles, roles, and permissions across your organization."
                />
                <Link href={users.create()}>
                <Button className="cursor-pointer">
                    <Plus size={12} /> Create
                </Button>
                </Link>
            </div>

        </div>
    );
};

export default UserIndex;
