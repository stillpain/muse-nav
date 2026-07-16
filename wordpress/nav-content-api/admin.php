<?php

defined('ABSPATH') || exit;

final class Twilight_Content_Admin {
    private const OPTION_GROUP = 'twilight_content_settings';

    public static function boot(): void {
        add_action('admin_menu', [self::class, 'register_menu']);
        add_action('admin_init', [self::class, 'register_settings']);
        add_action('init', [self::class, 'register_blog_meta']);
        add_action('add_meta_boxes_post', [self::class, 'add_blog_meta_box']);
        add_action('save_post_post', [self::class, 'save_blog_meta']);
        add_action('admin_head', [self::class, 'admin_styles']);
        add_filter('manage_nav_site_posts_columns', [self::class, 'site_columns']);
        add_action('manage_nav_site_posts_custom_column', [self::class, 'render_site_column'], 10, 2);
    }

    public static function register_menu(): void {
        add_menu_page(
            '暮色内容中心',
            '暮色内容',
            'edit_posts',
            'twilight-content',
            [self::class, 'render_dashboard'],
            'dashicons-admin-customizer',
            3
        );
        add_submenu_page('twilight-content', '内容概览', '内容概览', 'edit_posts', 'twilight-content', [self::class, 'render_dashboard']);
        add_submenu_page('twilight-content', '博客文章', '博客文章', 'edit_posts', 'edit.php');
        add_submenu_page('twilight-content', '后台设置', '后台设置', 'manage_options', 'twilight-settings', [self::class, 'render_settings']);
    }

    public static function register_settings(): void {
        register_setting(self::OPTION_GROUP, 'twilight_nav_public_origin', ['sanitize_callback' => [self::class, 'sanitize_origin']]);
        register_setting(self::OPTION_GROUP, 'twilight_nav_front_url', ['sanitize_callback' => 'esc_url_raw']);
        register_setting(self::OPTION_GROUP, 'twilight_blog_front_url', ['sanitize_callback' => 'esc_url_raw']);
        register_setting(self::OPTION_GROUP, 'twilight_nav_turnstile_secret', ['sanitize_callback' => 'sanitize_text_field']);
    }

    public static function register_blog_meta(): void {
        $fields = [
            'twilight_blog_subtitle' => ['type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'twilight_blog_read_time' => ['type' => 'integer', 'sanitize_callback' => 'absint'],
            'twilight_blog_accent' => ['type' => 'string', 'sanitize_callback' => [self::class, 'sanitize_accent']],
            'twilight_blog_seo_description' => ['type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field'],
        ];
        foreach ($fields as $key => $schema) {
            register_post_meta('post', $key, [
                'single' => true,
                'type' => $schema['type'],
                'show_in_rest' => true,
                'sanitize_callback' => $schema['sanitize_callback'],
                'auth_callback' => fn() => current_user_can('edit_posts'),
            ]);
        }
    }

    public static function sanitize_origin(string $value): string {
        return untrailingslashit(esc_url_raw($value, ['http', 'https']));
    }

    public static function sanitize_accent(string $value): string {
        return in_array($value, ['purple', 'teal', 'gold'], true) ? $value : 'purple';
    }

    public static function render_dashboard(): void {
        if (!current_user_can('edit_posts')) return;
        $post_counts = wp_count_posts('post');
        $site_counts = wp_count_posts('nav_site');
        $submission_counts = wp_count_posts('nav_submission');
        $revision = (string) get_option('twilight_nav_content_revision', '尚未生成');
        $cards = [
            ['博客文章', (int) ($post_counts->publish ?? 0), admin_url('edit.php'), '撰写文章、设置分类标签和特色图片。'],
            ['导航网站', (int) ($site_counts->publish ?? 0), admin_url('edit.php?post_type=nav_site'), '管理网址、推荐状态、详情内容和排序。'],
            ['待审投稿', (int) ($submission_counts->pending ?? 0), admin_url('edit.php?post_type=nav_submission'), '检查访客提交，审核后再转为导航网站。'],
        ];
        echo '<div class="wrap twilight-admin"><div class="twilight-admin-hero"><div><p>TWILIGHT CONTENT</p><h1>暮色内容中心</h1><span>博客和导航共用一个 WordPress 后台，前台通过 REST API 在构建时读取内容。</span></div><a class="button button-primary" href="' . esc_url(admin_url('post-new.php')) . '">写新文章</a></div>';
        echo '<div class="twilight-admin-grid">';
        foreach ($cards as [$label, $count, $url, $description]) {
            echo '<a class="twilight-admin-card" href="' . esc_url($url) . '"><span>' . esc_html((string) $count) . '</span><h2>' . esc_html($label) . '</h2><p>' . esc_html($description) . '</p><b>进入管理 →</b></a>';
        }
        echo '</div><div class="twilight-admin-panel"><h2>发布状态</h2><dl><div><dt>内容版本</dt><dd>' . esc_html($revision) . '</dd></div><div><dt>导航前台</dt><dd>' . self::front_link('twilight_nav_front_url') . '</dd></div><div><dt>博客前台</dt><dd>' . self::front_link('twilight_blog_front_url') . '</dd></div><div><dt>数据接口</dt><dd><a href="' . esc_url(rest_url('nav/v1/revision')) . '" target="_blank" rel="noopener">检查 REST API</a></dd></div></dl><p class="description">内容保存后会更新版本号。静态前台需要重新构建才会发布最新内容。</p></div></div>';
    }

    private static function front_link(string $option): string {
        $url = (string) get_option($option, '');
        return $url ? '<a href="' . esc_url($url) . '" target="_blank" rel="noopener">' . esc_html($url) . '</a>' : '<span>未配置</span>';
    }

    public static function render_settings(): void {
        if (!current_user_can('manage_options')) return;
        ?>
        <div class="wrap twilight-admin twilight-settings">
            <h1>暮色内容设置</h1>
            <p>配置两个前台地址以及公开投稿接口。密钥只保存在 WordPress 数据库中，不会通过 REST 输出。</p>
            <form method="post" action="options.php">
                <?php settings_fields(self::OPTION_GROUP); ?>
                <table class="form-table" role="presentation">
                    <?php self::text_row('导航前台地址', 'twilight_nav_front_url', 'https://example.com', '用于内容中心快速访问导航站。'); ?>
                    <?php self::text_row('博客前台地址', 'twilight_blog_front_url', 'https://blog.example.com', '用于内容中心快速访问博客。'); ?>
                    <?php self::text_row('允许投稿的 Origin', 'twilight_nav_public_origin', 'https://example.com', '必须与导航站浏览器 Origin 完全一致，不带结尾斜杠。'); ?>
                    <?php self::text_row('Turnstile Secret', 'twilight_nav_turnstile_secret', '', 'Cloudflare Turnstile 服务端密钥。留空时投稿接口拒绝请求。', 'password'); ?>
                </table>
                <?php submit_button('保存设置'); ?>
            </form>
        </div>
        <?php
    }

    private static function text_row(string $label, string $name, string $placeholder, string $help, string $type = 'url'): void {
        $value = (string) get_option($name, '');
        echo '<tr><th scope="row"><label for="' . esc_attr($name) . '">' . esc_html($label) . '</label></th><td><input class="regular-text" type="' . esc_attr($type) . '" id="' . esc_attr($name) . '" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" placeholder="' . esc_attr($placeholder) . '" autocomplete="off"><p class="description">' . esc_html($help) . '</p></td></tr>';
    }

    public static function add_blog_meta_box(): void {
        add_meta_box('twilight-blog-settings', '暮色博客设置', [self::class, 'render_blog_meta_box'], 'post', 'side', 'high');
    }

    public static function render_blog_meta_box(WP_Post $post): void {
        wp_nonce_field('twilight_save_blog_meta', 'twilight_blog_nonce');
        $subtitle = (string) get_post_meta($post->ID, 'twilight_blog_subtitle', true);
        $read_time = (int) get_post_meta($post->ID, 'twilight_blog_read_time', true);
        $accent = (string) get_post_meta($post->ID, 'twilight_blog_accent', true) ?: 'purple';
        $seo = (string) get_post_meta($post->ID, 'twilight_blog_seo_description', true);
        echo '<p><label for="twilight_blog_subtitle"><strong>文章副标题</strong></label><textarea class="widefat" rows="3" id="twilight_blog_subtitle" name="twilight_blog_subtitle">' . esc_textarea($subtitle) . '</textarea></p>';
        echo '<p><label for="twilight_blog_read_time"><strong>阅读时间（分钟）</strong></label><input class="widefat" type="number" min="1" max="120" id="twilight_blog_read_time" name="twilight_blog_read_time" value="' . esc_attr((string) ($read_time ?: 5)) . '"></p>';
        echo '<p><label for="twilight_blog_accent"><strong>标题主题色</strong></label><select class="widefat" id="twilight_blog_accent" name="twilight_blog_accent">';
        foreach (['purple' => '暮紫', 'teal' => '青绿', 'gold' => '暖金'] as $value => $label) echo '<option value="' . esc_attr($value) . '" ' . selected($accent, $value, false) . '>' . esc_html($label) . '</option>';
        echo '</select></p><p><label for="twilight_blog_seo_description"><strong>SEO 描述</strong></label><textarea class="widefat" rows="4" maxlength="180" id="twilight_blog_seo_description" name="twilight_blog_seo_description">' . esc_textarea($seo) . '</textarea></p>';
    }

    public static function save_blog_meta(int $post_id): void {
        if (!isset($_POST['twilight_blog_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['twilight_blog_nonce'])), 'twilight_save_blog_meta') || !current_user_can('edit_post', $post_id) || wp_is_post_revision($post_id)) return;
        update_post_meta($post_id, 'twilight_blog_subtitle', sanitize_text_field(wp_unslash($_POST['twilight_blog_subtitle'] ?? '')));
        update_post_meta($post_id, 'twilight_blog_read_time', min(120, max(1, absint($_POST['twilight_blog_read_time'] ?? 5))));
        update_post_meta($post_id, 'twilight_blog_accent', self::sanitize_accent(sanitize_key($_POST['twilight_blog_accent'] ?? 'purple')));
        update_post_meta($post_id, 'twilight_blog_seo_description', sanitize_textarea_field(wp_unslash($_POST['twilight_blog_seo_description'] ?? '')));
    }

    public static function site_columns(array $columns): array {
        return ['cb' => $columns['cb'], 'title' => '网站名称', 'nav_url' => '网址', 'taxonomy-nav_category' => '分类', 'nav_flags' => '状态', 'date' => '更新日期'];
    }

    public static function render_site_column(string $column, int $post_id): void {
        if ($column === 'nav_url') {
            $url = (string) get_post_meta($post_id, 'nav_url', true);
            echo $url ? '<a href="' . esc_url($url) . '" target="_blank" rel="noopener">' . esc_html(wp_parse_url($url, PHP_URL_HOST) ?: $url) . '</a>' : '<span class="description">未填写</span>';
        }
        if ($column === 'nav_flags') {
            if (get_post_meta($post_id, 'nav_featured', true)) echo '<span class="twilight-status">首页精选</span> ';
            if (get_post_meta($post_id, 'nav_indexable', true)) echo '<span class="twilight-status is-green">可收录详情</span>';
        }
    }

    public static function admin_styles(): void {
        echo '<style>.twilight-admin{max-width:1180px}.twilight-admin-hero{display:flex;align-items:end;justify-content:space-between;gap:24px;margin:22px 0;padding:30px;border-radius:18px;background:linear-gradient(135deg,#24213c,#6857d9);color:#fff}.twilight-admin-hero p{margin:0;color:#c8c1ff;font-size:11px;font-weight:800;letter-spacing:.16em}.twilight-admin-hero h1{margin:5px 0;color:#fff;font-size:32px}.twilight-admin-hero span{color:#ddd9fa}.twilight-admin-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.twilight-admin-card{padding:24px;border:1px solid #dcdcE7;border-radius:15px;background:#fff;color:#1d2433;text-decoration:none;box-shadow:0 8px 24px rgba(38,40,67,.06)}.twilight-admin-card>span{color:#6857d9;font-size:34px;font-weight:800}.twilight-admin-card h2{margin:5px 0}.twilight-admin-card p{min-height:42px;color:#697086}.twilight-admin-card b{color:#6857d9;font-size:12px}.twilight-admin-panel{margin-top:18px;padding:24px;border:1px solid #dcdcE7;border-radius:15px;background:#fff}.twilight-admin-panel dl{display:grid;grid-template-columns:repeat(2,1fr);gap:0 30px}.twilight-admin-panel dl div{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee}.twilight-status{display:inline-block;padding:3px 7px;border-radius:999px;background:#eee9ff;color:#5745bd;font-size:11px}.twilight-status.is-green{background:#dcf5ef;color:#177568}@media(max-width:800px){.twilight-admin-grid{grid-template-columns:1fr}.twilight-admin-panel dl{grid-template-columns:1fr}.twilight-admin-hero{align-items:start;flex-direction:column}}</style>';
    }
}
