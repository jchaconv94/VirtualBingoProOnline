# Servicios para mantener Render activo

## Opción 1: UptimeRobot (Recomendado)
1. Ve a https://uptimerobot.com
2. Crea cuenta gratis
3. Agregar Monitor → HTTP(s)
4. URL: https://virtualbingoproonline.onrender.com
5. Monitoring Interval: cada 5 minutos
6. Esto hará ping cada 5 min para mantener tu app despierta

## Opción 2: Cron-job.org
1. Ve a https://cron-job.org
2. Crea cuenta gratis
3. Crear cronjob
4. URL: https://virtualbingoproonline.onrender.com
5. Intervalo: cada 5 minutos

## Opción 3: Koyeb Ping
1. Ve a https://www.pingdom.com (versión gratis)
2. Configura ping cada 5 minutos

**Nota**: El plan gratuito de Render permite 750 horas/mes. Con ping cada 5 min, tu app estará siempre activa dentro del límite.
