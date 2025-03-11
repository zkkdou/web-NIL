<?php
// 表单处理示例
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $message = $_POST['message'] ?? '';
    
    // 验证数据
    if (empty($name) || empty($email) || empty($message)) {
        http_response_code(400);
        echo json_encode(['error' => '所有字段都是必填的']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => '请输入有效的邮箱地址']);
        exit;
    }
    
    // 这里可以添加发送邮件或保存到数据库的代码
    
    // 返回成功响应
    echo json_encode(['success' => true, 'message' => '消息已发送']);
} else {
    http_response_code(405);
 