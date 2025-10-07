export const GROK_CONVERSATION_ITEMS_FEATURES = {
    'creator_subscriptions_tweet_preview_api_enabled': true,
    'premium_content_api_read_enabled': false,
    'communities_web_enable_tweet_community_results_fetch': true,
    'c9s_tweet_anatomy_moderator_badge_enabled': true,
    'responsive_web_grok_analyze_button_fetch_trends_enabled': false,
    'responsive_web_grok_analyze_post_followups_enabled': true,
    'responsive_web_grok_share_attachment_enabled': true,
    'articles_preview_enabled': true,
    'responsive_web_edit_tweet_api_enabled': true,
    'graphql_is_translatable_rweb_tweet_is_translatable_enabled': true,
    'view_counts_everywhere_api_enabled': true,
    'longform_notetweets_consumption_enabled': true,
    'responsive_web_twitter_article_tweet_consumption_enabled': true,
    'tweet_awards_web_tipping_enabled': false,
    'creator_subscriptions_quote_tweet_preview_enabled': false,
    'freedom_of_speech_not_reach_fetch_enabled': true,
    'standardized_nudges_misinfo': true,
    'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled': true,
    'rweb_video_timestamps_enabled': true,
    'longform_notetweets_rich_text_read_enabled': true,
    'longform_notetweets_inline_media_enabled': true,
    'profile_label_improvements_pcf_label_in_post_enabled': false,
    'rweb_tipjar_consumption_enabled': true,
    'responsive_web_graphql_exclude_directive_enabled': true,
    'verified_phone_label_enabled': false,
    'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
    'responsive_web_graphql_timeline_navigation_enabled': true,
    'responsive_web_enhance_cards_enabled': false
};

export const Endpoint = {
    CREATE_GROK_CONVERSATION: 'https://x.com/i/api/graphql/vvC5uy7pWWHXS2aDi1FZeA/CreateGrokConversation',
    GROK_CONVERSATION_ITEMS_BY_REST_ID: 'https://x.com/i/api/graphql/nuCH8TfQbItLdaiNCCfQ_Q/GrokConversationItemsByRestId',
    GROK_ATTACHMENT: 'https://x.com/i/api/2/grok/attachment.json',
    GROK_ADD_RESPONSE: 'https://grok.x.com/2/grok/add_response.json',
    USE_SHARE_GROK_CONVERSATION_MUTATION: 'https://x.com/i/api/graphql/VjcMAfH8MXzaWoNmAsUidw/useShareGrokConversationMutation'
} as const;