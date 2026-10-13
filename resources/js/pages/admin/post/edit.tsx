import Heading from '@/components/heading';
import PostForm from '@/components/post-form';
import { dashboard } from '@/routes';
import posts from '@/routes/admin/posts';
import type { PostFormPageProps } from '@/types/props';

const PostEdit = (props: PostFormPageProps) => (
    <div className="space-y-6 p-5 md:p-8">
        <Heading
            title="Edit post"
            description={`Update "${props.post?.title ?? 'post'}" content, media, and SEO configuration.`}
        />
        {props.post && (
            <PostForm
                {...props}
                filterUrl={posts.edit(props.post.slug).url}
                cancelHref={posts.index.url()}
            />
        )}
    </div>
);

export default PostEdit;

PostEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Blog', href: posts.index() },
        { title: 'Edit' },
    ],
};
