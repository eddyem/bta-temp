#!/bin/bash
echo "Access-Control-Allow-Origin: http://ishtar.sao.ru"
echo "Access-Control-Allow-Headers: Content-Type, X-Requested-With"
echo -e "Acess-Control-Allow-Methods: POST\nContent-type:multipart/form-data\n\n"

#echo "<html><body><pre>"
/usr/local/bin/can_requestor -latest
#echo "</pre></body></html>"