# Lösung & Notizen: HTTP-Probes mit wget in BusyBox & Containern

## Notizen & Befehle

/ # wget -q -O - <http://backend-service:80>

<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy,
API gateway, load balancer, content cache, or other features.</p>

<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
/ # wget -q -O - http://backend-service:80
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy,
API gateway, load balancer, content cache, or other features.</p>

<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
/ # echo $?
0
/ # wget -q -O - http://backend-service:9999
wget: can't connect to remote host (10.105.248.39): Connection timed out
/ # echo $?
1

Aufgabe 3
/ # wget backend-service
Connecting to backend-service (10.105.248.39:80)
wget: can't open 'index.html': File exists
/ # rm index.html
/ # wget backend-service
Connecting to backend-service (10.105.248.39:80)
saving to 'index.html'
index.html 100% |******************\*******************| 896 0:00:00 ETA
'index.html' saved
/ # wget backend-service
Connecting to backend-service (10.105.248.39:80)
wget: can't open 'index.html': File exists
/ # wget <http://backend-service>
Connecting to backend-service (10.105.248.39:80)
wget: can't open 'index.html': File exists
/ # rm index.html
/ # wget <http://backend-service>
Connecting to backend-service (10.105.248.39:80)
saving to 'index.html'
index.html 100% |******************\*******************| 896 0:00:00 ETA
'index.html' saved
/ # rm index.html
/ # wget <http://backend-service.project-alpha.svc.cluster.local:80>
Connecting to backend-service.project-alpha.svc.cluster.local:80 (10.105.248.39:80)
saving to 'index.html'
index.html 100% |******************\*******************| 896 0:00:00 ETA
'index.html' saved

Aufgabe 4

Ich habe tatsächlich jetzt inzwischen den Unterschied gelernt. Also das erste, also Variante A, führt das Ganze einmal als direktes Linux-Programm aus und in Variante B wird das quasi innerhalb der Shell ausgeführt, also im Programm Shell.

Variante B brauchen wir dann somit, sobald wir halt Shell-Operationen machen, sprich brauchen While Loops oder wir machen Pipe oder machen logische Verknüpfungen und so weiter und so fort.
