import Heading from '@/components/heading';
import PostForm from '@/components/post-form';
import { dashboard } from '@/routes';
import posts from '@/routes/admin/posts';
import type { PostFormPageProps } from '@/types/props';

const PostCreate = (props: PostFormPageProps) => (
    <div className="space-y-6 p-5 md:p-8">
        <Heading
            title="Create post"
            description="Write a new blog post with rich content, media, tags, and complete SEO settings."
        />
        <PostForm {...props} filterUrl={posts.create.url()} />
    </div>
);

export default PostCreate;

PostCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Blog', href: posts.index() },
        { title: 'Create' },
    ],
};
