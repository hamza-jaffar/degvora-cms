import { dashboard } from '@/routes';
import type { GalleryPageProps } from './gallery-page';
import GalleryPage from './gallery-page';

const GalleryIndex = (props: GalleryPageProps) => {
    return (
        <div className="mx-auto w-full p-4">
            <GalleryPage {...props} />
        </div>
    );
};

export default GalleryIndex;

GalleryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Gallery',
        },
    ],
};
