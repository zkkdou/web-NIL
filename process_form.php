<?php
header('Content-Type: application/json');

// 允许跨域请求（如果需要的话）
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// 如果是预检请求，直接返回
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 检查是否是 POST 请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => '只允许 POST 请求']);
    exit();
}

try {
    // 获取表单数据
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $subject = $_POST['subject'] ?? '';
    $message = $_POST['message'] ?? '';
    
    // 验证必填字段
    if (empty($name) || empty($phone)) {
        throw new Exception('姓名和电话是必填项');
    }
    
    // 准备 CSV 数据
    $data = array(
        date('Y-m-d H:i:s'),  // 添加时间戳
        $name,
        $email,
        $phone,
        $subject,
        str_replace(["\r\n", "\r", "\n"], " ", $message)  // 将消息中的换行符替换为空格
    );
    
    // CSV 文件路径
    $csv_file = 'record/contact_forms.csv';
    
    // 如果文件不存在，创建文件并添加表头
    if (!file_exists($csv_file)) {
        $header = array(
            '提交时间',
            '姓名',
            '邮箱',
            '电话',
            '主题',
            '消息内容'
        );
        $fp = fopen($csv_file, 'w');
        fputcsv($fp, $header);
        fclose($fp);
    }
    
    // 追加数据到 CSV 文件
    $fp = fopen($csv_file, 'a');
    if ($fp === false) {
        throw new Exception('无法打开文件');
    }
    
    if (fputcsv($fp, $data) === false) {
        throw new Exception('写入数据失败');
    }
    
    fclose($fp);
    
    // 返回成功响应
    echo json_encode([
        'success' => true,
        'message' => '表单提交成功',
        'server_info' => [
            'php_version' => PHP_VERSION,
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'script_name' => $_SERVER['SCRIPT_NAME']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
} 