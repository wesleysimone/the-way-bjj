<?php
/* Copie este arquivo para config.php (na mesma pasta) e preencha.
 * O config.php NÃO vai para o GitHub (tem a senha do banco).
 */
return [
  // --- banco MySQL ---
  'host'    => 'localhost',     // na HostGator/Hostinger também é "localhost"
  'porta'   => 3306,
  'banco'   => 'theway',        // na hospedagem costuma ficar "usuario_theway"
  'usuario' => 'root',
  'senha'   => '',

  // --- códigos de acesso (troque!) ---
  'codigo_equipe' => 'TROQUE-EQUIPE',  // vai no link do grupo: ...?equipe=ESTE-CODIGO
  'codigo_admin'  => 'TROQUE-ADMIN',   // só seu (Wesley), diferente do outro

  // --- quais sites podem chamar a API ---
  // '*' libera todos. Para travar: ['https://wesleysimone.github.io', 'https://www.seudominio.com.br']
  'origens' => ['*'],
];
