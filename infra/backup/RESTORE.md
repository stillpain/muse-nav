# 恢复演练

1. 在隔离目录恢复指定 Restic 快照，不要直接覆盖生产卷。
2. 新建临时 MariaDB 和 WordPress Compose 项目，导入 `wordpress.sql`。
3. 将 `wp-content.tar.gz` 解压到临时 WordPress 卷，检查插件、上传和权限。
4. 使用临时域名访问后台、REST API、文章和导航内容。
5. 记录恢复耗时与缺失项；验证完成后销毁临时环境。
6. 只有生产故障时才停止生产服务并按同样步骤恢复，恢复前再保留一次故障现场快照。
