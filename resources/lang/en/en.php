<?php

declare(strict_types=1);

return [
    'name'        => 'Ichava',
    'description' => 'SVG icon management core with support for multi-variant, multi-category icon sets',

    'commands' => [
        'update_icons' => 'Update icons from remote repository',
        'downloading'  => 'Downloading :version...',
        'extracting'   => 'Extracting files...',
        'processing'   => 'Processing icons...',
        'cleaning'     => 'Cleaning up...',
        'complete'     => 'Done! Total :count icons.',
        'cached'       => 'Using cached download...',
    ],

    'errors' => [
        'icon_not_found'       => 'Icon ":name" not found in set ":set"',
        'set_not_found'        => 'Icon set ":name" not found',
        'invalid_path'         => 'Invalid icon path: :path',
        'render_failed'        => 'Failed to render icon: :error',
        'svg_not_found'        => 'SVG file not found: :path',
        'svg_empty'            => 'SVG file is empty: :path',
        'download_failed'      => 'Download failed: :error',
        'extraction_failed'    => 'Extraction failed: :error',
        'no_extracted_folder'  => 'No extracted folder found',
        'svg_folder_not_found' => 'SVG folder not found: :path',
    ],
];
