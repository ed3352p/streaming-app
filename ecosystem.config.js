// Configuration PM2 pour Lumixar
// Démarrer avec: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'lumixar',
    script: './server/server.js',
    
    // Mode cluster pour utiliser tous les CPU
    instances: 'max',
    exec_mode: 'cluster',
    
    // Variables d'environnement
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Logs
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Redémarrage automatique
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    
    // Gestion de la mémoire
    max_memory_restart: '500M',
    
    // Redémarrage en cas d'erreur
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Délai entre les redémarrages
    restart_delay: 4000,
    
    // Kill timeout
    kill_timeout: 5000,
    
    // Écouter les signaux
    listen_timeout: 3000,
    
    // Cron restart (optionnel - redémarrage quotidien à 4h)
    // cron_restart: '0 4 * * *',
    
    // Merge logs
    merge_logs: true,
    
    // Instance args
    instance_var: 'INSTANCE_ID'
  }]
};
