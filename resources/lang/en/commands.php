<?php

declare(strict_types=1);

/*
 * What this package's Artisan commands say to a person at a terminal. The
 * command's `$description` stays untranslated, as in ichava/core: Artisan reads
 * it before a locale is necessarily set.
 */
return [

    'inject_scripts' => [
        'not_found'       => 'package.json not found at: :path',
        'unparseable'     => 'Could not parse package.json: :error',
        'already_present' => 'Ichava npm scripts already present, nothing to do. Use --force to overwrite.',
        'injected'        => 'Ichava npm scripts injected into package.json:',
    ],

];
