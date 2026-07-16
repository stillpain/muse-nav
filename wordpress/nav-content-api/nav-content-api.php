<?php
/**
 * Plugin Name: 暮色内容中心
 * Description: 为导航站提供网站内容类型、分类标签、投稿和隐私友好的点击聚合接口。
 * Version: 0.2.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 */

defined('ABSPATH') || exit;

final class Twilight_Nav_Content_API {
    private const VERSION_OPTION = 'twilight_nav_content_revision';
    private const SITE_META = [
        'nav_uuid' => 'string', 'nav_url' => 'string', 'nav_description' => 'string', 'nav_logo' => 'string',
        'nav_featured' => 'boolean', 'nav_recommended' => 'boolean', 'nav_sort_order' => 'integer',
        'nav_pricing' => 'string', 'nav_language' => 'array', 'nav_screenshots' => 'array',
        'nav_alternatives' => 'array', 'nav_related_posts' => 'array', 'nav_indexable' => 'boolean',
    ];

    public static function boot(): void {
        add_action('init', [self::class, 'register_content']);
        add_action('rest_api_init', [self::class, 'register_routes']);
        add_action('add_meta_boxes_nav_site', [self::class, 'add_site_meta_box']);
        add_action('save_post_nav_site', [self::class, 'save_site_meta'], 10, 2);
        add_action('save_post_nav_site', [self::class, 'touch_revision']);
        add_action('created_nav_category', [self::class, 'touch_revision']);
        add_action('edited_nav_category', [self::class, 'touch_revision']);
        add_action('created_nav_tag', [self::class, 'touch_revision']);
        add_action('edited_nav_tag', [self::class, 'touch_revision']);
        add_action('created_nav_category', [self::class, 'ensure_term_uuid']);
        add_action('created_nav_tag', [self::class, 'ensure_term_uuid']);
    }

    public static function activate(): void {
        self::register_content();
        self::create_click_table();
        update_option(self::VERSION_OPTION, gmdate('c'), false);
        flush_rewrite_rules();
    }

    public static function deactivate(): void { flush_rewrite_rules(); }

    public static function register_content(): void {
        register_post_type('nav_site', [
            'labels' => ['name' => '导航网站', 'singular_name' => '导航网站', 'add_new_item' => '添加导航网站', 'edit_item' => '编辑导航网站'],
            'public' => true, 'show_in_rest' => true, 'rest_base' => 'nav-sites', 'show_in_menu' => 'twilight-content', 'menu_icon' => 'dashicons-admin-site-alt3',
            'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'], 'has_archive' => false,
            'rewrite' => ['slug' => 'site-source', 'with_front' => false],
        ]);
        register_post_type('nav_submission', [
            'labels' => ['name' => '网站投稿', 'singular_name' => '网站投稿'], 'public' => false,
            'show_ui' => true, 'show_in_rest' => false, 'show_in_menu' => 'twilight-content', 'menu_icon' => 'dashicons-email-alt2', 'supports' => ['title', 'editor'],
        ]);
        register_taxonomy('nav_category', ['nav_site'], [
            'labels' => ['name' => '导航分类', 'singular_name' => '导航分类'], 'public' => true,
            'show_in_rest' => true, 'hierarchical' => true, 'rewrite' => ['slug' => 'nav-category'],
        ]);
        register_taxonomy('nav_tag', ['nav_site'], [
            'labels' => ['name' => '导航标签', 'singular_name' => '导航标签'], 'public' => true,
            'show_in_rest' => true, 'hierarchical' => false, 'rewrite' => ['slug' => 'nav-tag'],
        ]);
        foreach (self::SITE_META as $key => $type) {
            $args = ['single' => true, 'type' => $type, 'show_in_rest' => true, 'auth_callback' => fn() => current_user_can('edit_posts')];
            if ($type === 'array') $args['show_in_rest'] = ['schema' => ['type' => 'array', 'items' => ['type' => 'string']]];
            register_post_meta('nav_site', $key, $args);
        }
        register_term_meta('nav_category', 'nav_uuid', ['single' => true, 'type' => 'string', 'show_in_rest' => true]);
        register_term_meta('nav_category', 'nav_icon', ['single' => true, 'type' => 'string', 'show_in_rest' => true]);
        register_term_meta('nav_category', 'nav_color', ['single' => true, 'type' => 'string', 'show_in_rest' => true]);
        register_term_meta('nav_category', 'nav_sort_order', ['single' => true, 'type' => 'integer', 'show_in_rest' => true]);
        register_term_meta('nav_category', 'nav_seo_title', ['single' => true, 'type' => 'string', 'show_in_rest' => true]);
        register_term_meta('nav_category', 'nav_seo_description', ['single' => true, 'type' => 'string', 'show_in_rest' => true]);
        register_term_meta('nav_tag', 'nav_uuid', ['single' => true, 'type' => 'string', 'show_in_rest' => true]);
    }

    public static function register_routes(): void {
        register_rest_route('nav/v1', '/revision', ['methods' => 'GET', 'callback' => fn() => ['revision' => get_option(self::VERSION_OPTION, '')], 'permission_callback' => '__return_true']);
        register_rest_route('nav/v1', '/submissions', ['methods' => 'POST', 'callback' => [self::class, 'submit_site'], 'permission_callback' => '__return_true']);
        register_rest_route('nav/v1', '/clicks', ['methods' => 'POST', 'callback' => [self::class, 'record_click'], 'permission_callback' => '__return_true']);
    }

    private static function allowed_origin(WP_REST_Request $request): bool {
        $allowed = rtrim((string) get_option('twilight_nav_public_origin', ''), '/');
        $origin = rtrim((string) $request->get_header('origin'), '/');
        return $allowed !== '' && hash_equals($allowed, $origin);
    }

    private static function verify_turnstile(string $token): bool {
        $secret = (string) get_option('twilight_nav_turnstile_secret', '');
        if ($secret === '' || $token === '') return false;
        $response = wp_remote_post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'timeout' => 8, 'body' => ['secret' => $secret, 'response' => $token],
        ]);
        if (is_wp_error($response)) return false;
        $body = json_decode((string) wp_remote_retrieve_body($response), true);
        return !empty($body['success']);
    }

    public static function submit_site(WP_REST_Request $request): WP_REST_Response|WP_Error {
        if (!self::allowed_origin($request)) return new WP_Error('forbidden_origin', '不允许的来源。', ['status' => 403]);
        if (!self::verify_turnstile(sanitize_text_field((string) $request['turnstileToken']))) return new WP_Error('turnstile_failed', '安全验证失败。', ['status' => 400]);
        $name = sanitize_text_field((string) $request['name']);
        $url = esc_url_raw((string) $request['url'], ['http', 'https']);
        $email = sanitize_email((string) $request['email']);
        $reason = sanitize_textarea_field((string) $request['reason']);
        if ($name === '' || !$url || !is_email($email) || mb_strlen($reason) < 30 || mb_strlen($reason) > 1200) return new WP_Error('invalid_submission', '投稿信息不完整。', ['status' => 422]);
        $duplicate = get_posts(['post_type' => ['nav_site', 'nav_submission'], 'post_status' => 'any', 'posts_per_page' => 1, 'meta_key' => 'nav_url', 'meta_value' => untrailingslashit($url)]);
        if ($duplicate) return new WP_Error('duplicate_url', '这个网址已存在或正在审核。', ['status' => 409]);
        $id = wp_insert_post(['post_type' => 'nav_submission', 'post_status' => 'pending', 'post_title' => $name, 'post_content' => $reason], true);
        if (is_wp_error($id)) return $id;
        update_post_meta($id, 'nav_url', untrailingslashit($url));
        update_post_meta($id, 'nav_contact_email', $email);
        update_post_meta($id, 'nav_suggested_category', sanitize_text_field((string) $request['category']));
        return new WP_REST_Response(['accepted' => true, 'submissionId' => $id], 202);
    }

    public static function record_click(WP_REST_Request $request): WP_REST_Response|WP_Error {
        if (!self::allowed_origin($request)) return new WP_Error('forbidden_origin', '不允许的来源。', ['status' => 403]);
        $site_id = sanitize_text_field((string) $request['siteId']);
        $source = sanitize_key((string) ($request['source'] ?: 'direct'));
        $device = sanitize_key((string) ($request['device'] ?: 'unknown'));
        if (!preg_match('/^[0-9a-f-]{36}$/i', $site_id) || !in_array($source, ['home','category','detail','search','direct'], true) || !in_array($device, ['desktop','mobile','tablet','unknown'], true)) return new WP_Error('invalid_event', '无效事件。', ['status' => 422]);
        global $wpdb; $table = $wpdb->prefix . 'nav_click_daily';
        $sql = $wpdb->prepare("INSERT INTO $table (click_date, site_id, source_type, device_type, click_count) VALUES (%s,%s,%s,%s,1) ON DUPLICATE KEY UPDATE click_count = click_count + 1", gmdate('Y-m-d'), $site_id, $source, $device);
        $wpdb->query($sql);
        return new WP_REST_Response(['accepted' => true], 202);
    }

    public static function add_site_meta_box(): void { add_meta_box('twilight-nav-site', '导航属性', [self::class, 'render_site_meta_box'], 'nav_site', 'normal', 'high'); }

    public static function render_site_meta_box(WP_Post $post): void {
        wp_nonce_field('twilight_nav_save_site', 'twilight_nav_nonce');
        $fields = [
            'nav_uuid' => '稳定 UUID', 'nav_url' => '网站地址', 'nav_description' => '卡片短描述', 'nav_logo' => 'Logo 地址',
            'nav_sort_order' => '排序', 'nav_pricing' => '费用模式', 'nav_language' => '语言（逗号分隔）',
            'nav_alternatives' => '替代网站 slug（逗号分隔）', 'nav_related_posts' => '相关文章 ID（逗号分隔）',
        ];
        echo '<table class="form-table"><tbody>';
        foreach ($fields as $key => $label) {
            $value = get_post_meta($post->ID, $key, true); if (is_array($value)) $value = implode(',', $value);
            printf('<tr><th><label for="%1$s">%2$s</label></th><td><input class="widefat" id="%1$s" name="%1$s" value="%3$s"></td></tr>', esc_attr($key), esc_html($label), esc_attr((string) $value));
        }
        foreach (['nav_featured' => '首页精选', 'nav_recommended' => '编辑推荐', 'nav_indexable' => '允许详情页索引'] as $key => $label) {
            printf('<tr><th>%s</th><td><label><input type="checkbox" name="%s" value="1" %s> 启用</label></td></tr>', esc_html($label), esc_attr($key), checked((bool) get_post_meta($post->ID, $key, true), true, false));
        }
        echo '</tbody></table>';
    }

    public static function save_site_meta(int $post_id, WP_Post $post): void {
        if (!isset($_POST['twilight_nav_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['twilight_nav_nonce'])), 'twilight_nav_save_site') || !current_user_can('edit_post', $post_id) || wp_is_post_revision($post_id)) return;
        $uuid = isset($_POST['nav_uuid']) ? sanitize_text_field(wp_unslash($_POST['nav_uuid'])) : '';
        if (!wp_is_uuid($uuid)) $uuid = (string) get_post_meta($post_id, 'nav_uuid', true);
        if (!wp_is_uuid($uuid)) $uuid = wp_generate_uuid4();
        update_post_meta($post_id, 'nav_uuid', $uuid);
        foreach (['nav_url','nav_description','nav_logo','nav_pricing'] as $key) if (isset($_POST[$key])) update_post_meta($post_id, $key, sanitize_text_field(wp_unslash($_POST[$key])));
        update_post_meta($post_id, 'nav_sort_order', isset($_POST['nav_sort_order']) ? absint($_POST['nav_sort_order']) : 0);
        foreach (['nav_language','nav_alternatives','nav_related_posts'] as $key) {
            $value = isset($_POST[$key]) ? array_values(array_filter(array_map('sanitize_text_field', explode(',', wp_unslash($_POST[$key]))))) : [];
            update_post_meta($post_id, $key, $value);
        }
        foreach (['nav_featured','nav_recommended','nav_indexable'] as $key) update_post_meta($post_id, $key, isset($_POST[$key]));
    }

    public static function ensure_term_uuid(int $term_id): void {
        if (!wp_is_uuid((string) get_term_meta($term_id, 'nav_uuid', true))) {
            update_term_meta($term_id, 'nav_uuid', wp_generate_uuid4());
        }
    }

    public static function touch_revision(): void { update_option(self::VERSION_OPTION, gmdate('c'), false); }

    private static function create_click_table(): void {
        global $wpdb; require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = $wpdb->prefix . 'nav_click_daily'; $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE $table (id bigint unsigned NOT NULL AUTO_INCREMENT, click_date date NOT NULL, site_id char(36) NOT NULL, source_type varchar(20) NOT NULL, device_type varchar(20) NOT NULL, click_count bigint unsigned NOT NULL DEFAULT 0, PRIMARY KEY (id), UNIQUE KEY aggregate (click_date, site_id, source_type, device_type), KEY site_date (site_id, click_date)) $charset;");
    }
}

register_activation_hook(__FILE__, [Twilight_Nav_Content_API::class, 'activate']);
register_deactivation_hook(__FILE__, [Twilight_Nav_Content_API::class, 'deactivate']);
Twilight_Nav_Content_API::boot();
require_once __DIR__ . '/admin.php';
Twilight_Content_Admin::boot();
