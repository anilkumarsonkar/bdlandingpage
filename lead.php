<?php
/**
 * GlobalCare Health — Bangladesh landing page lead endpoint
 * ------------------------------------------------------------
 * Receives the case form (multipart/form-data, incl. reports[] uploads),
 * validates it, emails the lead with attachments to LEAD_TO, keeps a
 * backup copy (JSON line + files) outside the web root, and returns JSON.
 *
 * Deployed at: https://4rx.co/bangladesh/lead.php
 * Called by:   js/script.js → submitLead()
 */

declare(strict_types=1);

const LEAD_TO        = 'enquiry@globalcarehealth.com';           // where leads go
const LEAD_CC        = 'sonkar7233@gmail.com';                     // optional CC (comma-separated)
const LEAD_FROM      = 'leads@4rx.co';                            // must be a domain on this server (SPF)
const LEAD_FROM_NAME = 'GlobalCare Bangladesh Landing Page';
const MAX_FILES      = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024;                          // 10 MB per file
const MAX_TOTAL_BYTES= 25 * 1024 * 1024;                          // 25 MB per submission (email-safe)
const ALLOWED_MIME   = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
// Backup store outside public_html (created on first use)
const STORE_DIR      = '/home/rx/storage/bangladesh_leads';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function field(string $k, int $max = 200): string {
    $v = isset($_POST[$k]) ? (string)$_POST[$k] : '';
    $v = trim(preg_replace('/[\r\n\t]+/', ' ', $v) ?? '');
    return mb_substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

// Honeypot: real visitors never fill this hidden field
if (field('website') !== '') {
    respond(200, ['ok' => true]); // pretend success, drop silently
}

// Very light rate limit per IP (10 submissions / 10 minutes)
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ip = trim(explode(',', $ip)[0]);
$rlDir = sys_get_temp_dir() . '/bd_lead_rl';
@mkdir($rlDir, 0700, true);
$rlFile = $rlDir . '/' . md5($ip);
$hits = is_file($rlFile) ? array_filter(array_map('intval', file($rlFile, FILE_IGNORE_NEW_LINES)), fn($t) => $t > time() - 600) : [];
if (count($hits) >= 10) {
    respond(429, ['ok' => false, 'error' => 'Too many submissions. Please try again later or message us on WhatsApp.']);
}
$hits[] = time();
@file_put_contents($rlFile, implode("\n", $hits));

// ---- Collect & validate ----
$data = [
    'specialty_variant' => field('specialty_variant', 20),
    'specialty'         => field('specialty', 20),
    'whoFor'            => field('whoFor', 60),
    'diagnosis'         => field('diagnosis', 120),
    'reportsDone'       => field('reportsDone', 60),
    'timeline'          => field('timeline', 60),
    'indiaIntent'       => field('indiaIntent', 80),
    'patientName'       => field('patientName', 120),
    'age'               => field('age', 3),
    'city'              => field('city', 80),
    'whatsapp'          => field('whatsapp', 30),
    'email'             => field('email', 120),
    'whatsappOptIn'     => field('whatsappOptIn', 5) === 'yes' ? 'Yes' : 'No',
];

$errors = [];
if ($data['patientName'] === '')                         $errors[] = 'Patient name is required.';
if ($data['whatsapp'] === '' || !preg_match('/^[0-9 +\-]{8,20}$/', $data['whatsapp'])) $errors[] = 'A valid WhatsApp number is required.';
if ($data['city'] === '')                                $errors[] = 'City is required.';
if ($data['age'] !== '' && !ctype_digit($data['age']))   $errors[] = 'Age must be a number.';
if ($data['email'] !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'Email address is not valid.';
if ($errors) {
    respond(422, ['ok' => false, 'error' => implode(' ', $errors)]);
}

// Normalise WhatsApp number: digits only, prefix +880 if the visitor typed a local number
$digits = preg_replace('/\D+/', '', $data['whatsapp']);
if (strlen($digits) >= 9 && strlen($digits) <= 11 && !str_starts_with($digits, '880')) {
    $digits = '880' . ltrim($digits, '0');
}
$data['whatsapp_e164'] = '+' . $digits;

// ---- Attachments ----
$attachments = [];
$total = 0;
if (!empty($_FILES['reports']) && is_array($_FILES['reports']['name'])) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $n = min(count($_FILES['reports']['name']), MAX_FILES);
    for ($i = 0; $i < $n; $i++) {
        if (($_FILES['reports']['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
        $tmp  = $_FILES['reports']['tmp_name'][$i];
        $size = (int)$_FILES['reports']['size'][$i];
        if ($size <= 0 || $size > MAX_FILE_BYTES) continue;
        $mime = $finfo->file($tmp) ?: '';
        if (!isset(ALLOWED_MIME[$mime])) continue;
        if ($total + $size > MAX_TOTAL_BYTES) break;
        $total += $size;
        $orig = preg_replace('/[^A-Za-z0-9._-]+/', '_', basename((string)$_FILES['reports']['name'][$i]));
        $orig = mb_substr($orig, 0, 80) ?: 'report';
        if (!preg_match('/\.' . ALLOWED_MIME[$mime] . '$/i', $orig)) $orig .= '.' . ALLOWED_MIME[$mime];
        $attachments[] = ['path' => $tmp, 'name' => $orig, 'mime' => $mime, 'size' => $size];
    }
}

// ---- Backup copy (outside web root) ----
$ref = date('Ymd-His') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
try {
    if (!is_dir(STORE_DIR)) @mkdir(STORE_DIR, 0750, true);
    if (is_dir(STORE_DIR) && is_writable(STORE_DIR)) {
        $saved = [];
        if ($attachments) {
            $dir = STORE_DIR . '/' . $ref;
            @mkdir($dir, 0750, true);
            foreach ($attachments as $a) {
                $dest = $dir . '/' . $a['name'];
                if (@copy($a['path'], $dest)) $saved[] = $dest;
            }
        }
        $line = json_encode(['ref' => $ref, 'time' => date('c'), 'ip' => $ip, 'data' => $data, 'files' => $saved], JSON_UNESCAPED_UNICODE);
        @file_put_contents(STORE_DIR . '/leads.jsonl', $line . "\n", FILE_APPEND | LOCK_EX);
    }
} catch (Throwable $e) { /* backup is best-effort */ }

// ---- Email ----
$variantLabel = ['oncology' => 'Oncology', 'bmt' => 'BMT / Blood Cancer', 'cardiac' => 'Cardiac'][$data['specialty']] ?? (ucfirst($data['specialty']) ?: 'Unknown');
$subject = sprintf('[Bangladesh Lead — %s] %s, %s · %s', $variantLabel, $data['patientName'], $data['city'], $data['whatsapp_e164']);

$rows = [
    'Reference'                 => $ref,
    'Specialty'                 => $variantLabel . ($data['specialty_variant'] && $data['specialty_variant'] !== $data['specialty'] ? " (landed on {$data['specialty_variant']} page)" : ''),
    'Who is this for'           => $data['whoFor'],
    'Diagnosis / procedure'     => $data['diagnosis'],
    'Medical reports done?'     => $data['reportsDone'],
    'Hoping to start'           => $data['timeline'],
    'Considering travel to India' => $data['indiaIntent'],
    'Patient name'              => $data['patientName'],
    'Age'                       => $data['age'],
    'City'                      => $data['city'],
    'WhatsApp'                  => $data['whatsapp_e164'] . ' (typed: ' . $data['whatsapp'] . ')',
    'Email'                     => $data['email'] ?: '—',
    'WhatsApp updates opt-in'   => $data['whatsappOptIn'],
    'Reports attached'          => $attachments ? count($attachments) . ' file(s)' : 'None — coordinator to request on WhatsApp',
    'Submitted'                 => date('d M Y, H:i') . ' (server time)',
    'Source'                    => ($_SERVER['HTTP_REFERER'] ?? 'https://4rx.co/bangladesh/'),
];

$esc = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$html  = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#16263f">';
$html .= '<h2 style="margin:0 0 4px;color:#165699">New case from the Bangladesh landing page</h2>';
$html .= '<p style="margin:0 0 14px;color:#47535f">' . $esc($variantLabel) . ' · reply on WhatsApp: <a href="https://wa.me/' . $esc($digits) . '">' . $esc($data['whatsapp_e164']) . '</a></p>';
$html .= '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5ecee">';
$text  = "New case from the Bangladesh landing page\n\n";
foreach ($rows as $k => $v) {
    $html .= '<tr><td style="border:1px solid #e5ecee;background:#f3f8f8;font-weight:bold;white-space:nowrap">' . $esc($k) . '</td><td style="border:1px solid #e5ecee">' . $esc($v) . '</td></tr>';
    $text .= str_pad($k . ':', 30) . $v . "\n";
}
$html .= '</table>';
if ($attachments) {
    $html .= '<p style="margin-top:12px"><b>Attached reports:</b> ' . $esc(implode(', ', array_column($attachments, 'name'))) . '</p>';
    $text .= "\nAttached: " . implode(', ', array_column($attachments, 'name')) . "\n";
}
$html .= '<p style="margin-top:16px;font-size:12px;color:#7c8a93">Sent automatically by the landing page at 4rx.co/bangladesh. Medical information is confidential — share only with the reviewing specialist.</p></div>';

// Build MIME message
$boundaryAlt = 'alt-' . bin2hex(random_bytes(8));
$boundaryMix = 'mix-' . bin2hex(random_bytes(8));
$headers  = 'From: ' . mb_encode_mimeheader(LEAD_FROM_NAME, 'UTF-8') . ' <' . LEAD_FROM . ">\r\n";
if ($data['email'] !== '') $headers .= 'Reply-To: ' . mb_encode_mimeheader($data['patientName'], 'UTF-8') . ' <' . $data['email'] . ">\r\n";
if (LEAD_CC !== '') $headers .= 'Cc: ' . LEAD_CC . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "X-Mailer: GlobalCare-BD-Landing/1.0\r\n";
$headers .= "X-Lead-Ref: {$ref}\r\n";

// base64 keeps every line under the SMTP limit (long HTML lines otherwise bounce: "lines too long for transport")
$alt  = "--{$boundaryAlt}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text)) . "\r\n";
$alt .= "--{$boundaryAlt}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "\r\n--{$boundaryAlt}--\r\n";

if ($attachments) {
    $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundaryMix}\"\r\n";
    $body  = "--{$boundaryMix}\r\nContent-Type: multipart/alternative; boundary=\"{$boundaryAlt}\"\r\n\r\n{$alt}";
    foreach ($attachments as $a) {
        $body .= "\r\n--{$boundaryMix}\r\n";
        $body .= "Content-Type: {$a['mime']}; name=\"{$a['name']}\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n";
        $body .= chunk_split(base64_encode((string)file_get_contents($a['path'])));
    }
    $body .= "--{$boundaryMix}--\r\n";
} else {
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundaryAlt}\"\r\n";
    $body = $alt;
}

$sent = @mail(LEAD_TO, mb_encode_mimeheader($subject, 'UTF-8'), $body, $headers, '-f' . LEAD_FROM);

if (!$sent) {
    error_log("[bangladesh lead] mail() failed for ref {$ref}");
    respond(500, ['ok' => false, 'error' => 'We could not send your details right now. Please message us on WhatsApp.', 'ref' => $ref]);
}
respond(200, ['ok' => true, 'ref' => $ref, 'attachments' => count($attachments)]);
