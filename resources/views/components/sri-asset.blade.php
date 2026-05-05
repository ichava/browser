@if ($tag === 'script')
<script src="{{ $url }}"@if ($integrity) integrity="{{ $integrity }}" crossorigin="{{ $crossorigin }}"@endif @if ($type) type="{{ $type }}"@endif @if ($defer) defer @endif @if ($async) async @endif></script>
@else
<link rel="{{ $rel }}" href="{{ $url }}"@if ($integrity) integrity="{{ $integrity }}" crossorigin="{{ $crossorigin }}"@endif />
@endif
