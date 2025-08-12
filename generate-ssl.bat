@echo off
echo 正在生成SSL证书...

REM 创建ssl目录
if not exist ssl mkdir ssl

REM 生成自签名证书
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=CN/ST=Shanghai/L=Shanghai/O=WeiNaTech/OU=IT/CN=124.220.134.33"

echo SSL证书生成完成！
echo 证书文件位置：
echo   - ssl/cert.pem (证书文件)
echo   - ssl/key.pem (私钥文件)
echo.
echo 现在可以重启服务器以启用HTTPS：
echo   node 06-server.js
echo.
echo HTTPS访问地址：
echo   https://124.220.134.33:8443
pause 