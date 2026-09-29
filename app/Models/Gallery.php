<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable('disk', 'filename', 'original_name', 'path', 'mime_type', 'alt', 'size', 'width', 'height')]
class Gallery extends Model
{
    //
}
