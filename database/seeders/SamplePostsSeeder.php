<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SamplePostsSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();

        if (! $user) {
            $this->command->warn('No users found. Skipping post seeding.');

            return;
        }

        $posts = [
            [
                'title' => 'When to Choose Professional Packing & Storage Over DIY',
                'excerpt' => 'Nobody enjoys moving house. Being somewhere better is good, of course, but the process of packing up and going, then unpacking and settling in can be stressful.',
                'content' => '<p>Nobody enjoys moving house. Being somewhere better is good, of course, but the process of packing up and going, then unpacking and settling in is often a different matter entirely.</p><p>When moving house, many people default to a DIY approach for packing their belongings. It saves money on the surface, and gives you control over your possessions. However, there are several situations where professional packing and storage services are clearly the better option.</p>',
            ],
            [
                'title' => 'What to Look for When Choosing a Self-Storage Facility',
                'excerpt' => 'Self-storage is a way of getting items out of your home to free up space, while having them available without too much hassle if you need them.',
                'content' => '<p>Self-storage is a way of getting items out of your home to free up space, while having them available without too much hassle if you need them.</p><p>When considering which self-storage facility to use, there are several important factors to evaluate. Location, security, access hours, and pricing all play a role in making the right decision for your storage needs.</p>',
            ],
            [
                'title' => 'How UAE Retailers Use Storage Pods for Seasonal Inventory',
                'excerpt' => 'Sometimes it can seem as if you are running two businesses at once, with day-to-day requirements on the one hand and future needs on the other.',
                'content' => '<p>Sometimes it can seem as if you are running two businesses at once, with day-to-day requirements on the one hand and future needs on the other. Retailers across the UAE have discovered an innovative solution to seasonal inventory management through storage pods.</p>',
            ],
            [
                'title' => 'Business Storage Solutions in Dubai: A Cost-Effective Alternative',
                'excerpt' => 'Growing businesses in Dubai often face a common challenge: they need more space for inventory, documents, or equipment but expanding their office or warehouse is expensive.',
                'content' => '<p>Growing businesses in Dubai often face a common challenge: they need more space for inventory, documents, or equipment but expanding their office or warehouse is expensive and inflexible. Business storage solutions provide a flexible, cost-effective way to handle this challenge.</p>',
            ],
            [
                'title' => 'Professional Movers or DIY? Dubai Move Cost Analysis',
                'excerpt' => 'Moving house is not so much a complicated business as a stressful one. It is bad enough moving from one town to another within your home country.',
                'content' => '<p>Moving house is not so much a complicated business as a stressful one. It is bad enough moving from one town to another within your home country. Moving to or from Dubai adds layers of complexity that make a proper cost analysis essential before making your decision.</p>',
            ],
            [
                'title' => 'Dubai vs Abu Dhabi Moving Costs and What to Expect in 2026',
                'excerpt' => 'What is it about Dubai that makes it synonymous with the United Arab Emirates? Both cities offer unique opportunities, and the costs of moving between them vary considerably.',
                'content' => '<p>What is it about Dubai that makes it synonymous with the United Arab Emirates? Both Dubai and Abu Dhabi are vibrant cities with their own distinct character, and if you\'re planning a move between them, understanding the costs involved is crucial.</p>',
            ],
        ];

        foreach ($posts as $index => $postData) {
            Post::create([
                'author_id' => $user->id,
                'category_id' => null,
                'title' => $postData['title'],
                'slug' => Str::slug($postData['title']),
                'excerpt' => $postData['excerpt'],
                'content' => $postData['content'],
                'featured_image' => null,
                'tags' => ['moving', 'storage'],
                'is_featured' => $index < 2,
                'status' => 'published',
                'visibility' => 'public',
                'published_at' => now()->subDays($index * 3),
                'robots' => 'index,follow',
            ]);
        }

        $this->command->info('Created '.count($posts).' sample blog posts.');
    }
}
