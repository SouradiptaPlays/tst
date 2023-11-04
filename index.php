<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ThroughSpaceTime</title>
    <style>
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        @font-face {
            font-family: 'PixelFont';
            src: url('fonts/pixelfont/PublicPixel.woff2') format('woff2'),
                url('fonts/pixelfont/PublicPixel.woff') format('woff'),
                url('fonts/pixelfont/PublicPixel.otf') format('otf'),
                url('fonts/pixelfont/PublicPixel.tff') format('ttf');
            font-weight: normal;
            font-style: normal;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
    <script src="main.js" type="module"></script>
</body>
</html>