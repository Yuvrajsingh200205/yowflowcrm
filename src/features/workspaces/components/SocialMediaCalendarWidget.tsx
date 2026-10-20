import React, { useState, useEffect } from 'react';
import { TeamTask } from '@/types';
import { 
  Share2, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Filter, 
  UserPlus, 
  Instagram, 
  Youtube, 
  Facebook, 
  Globe, 
  Sparkles,
  Layers,
  Video,
  FileText,
  Search,
  BookOpen,
  Link as LinkIcon,
  Tag,
  Laptop,
  Upload,
  Paperclip,
  CheckSquare,
  StickyNote,
  Target,
  ListTodo,
  Check,
  Zap,
  FolderPlus
} from 'lucide-react';
import { BRAND } from '@/config/brand';

export interface SocialAccount {
  id: string;
  clientName: string;
  handle: string;
  platform: 'All' | 'Instagram' | 'Facebook' | 'YouTube' | 'LinkedIn' | 'Pinterest' | 'X' | 'GMB' | 'Tumblr' | 'TikTok' | 'Threads' | 'Snapchat' | 'WhatsApp' | 'Telegram' | 'Reddit' | 'Medium' | 'Website' | 'Other';
  monthlyGoal: number;
  notes?: string;
  color?: string;
}

export interface DomainTask {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  createdAt?: string;
}

export interface TargetingKeyword {
  id: string;
  keyword: string;
  targetUrl?: string;
  searchVolume?: string;
  difficulty?: 'High' | 'Medium' | 'Low';
  status?: 'Targeted' | 'Ranking In Top 10' | 'Top 3' | 'Planned';
}

export interface WebsiteDomain {
  id: string;
  siteName: string;
  url: string;
  type: 'WordPress' | 'Custom React/Next.js' | 'Medium / Substack' | 'Portfolio & Gallery' | 'Shopify / E-Commerce' | 'Other';
  monthlyGoal: number;
  notes?: string;
  tasks?: DomainTask[];
  keywords?: TargetingKeyword[];
  attachments?: WebContentAttachment[];
  color?: string;
}

export const POPULAR_POST_PLATFORMS = [
  { id: 'Instagram', label: 'Instagram', icon: '📷' },
  { id: 'Facebook', label: 'Facebook', icon: '👍' },
  { id: 'YouTube', label: 'YouTube', icon: '▶' },
  { id: 'LinkedIn', label: 'LinkedIn', icon: '💼' },
  { id: 'Pinterest', label: 'Pinterest', icon: '📌' },
  { id: 'X', label: 'X', icon: '𝕏' },
  { id: 'GMB', label: 'GMB', icon: '📍' },
  { id: 'Tumblr', label: 'Tumblr', icon: '🌀' },
  { id: 'TikTok', label: 'TikTok', icon: '🎵' },
  { id: 'Threads', label: 'Threads', icon: '🧵' },
  { id: 'Snapchat', label: 'Snapchat', icon: '👻' },
  { id: 'WhatsApp', label: 'WhatsApp', icon: '💬' },
  { id: 'Website', label: 'Website', icon: '🌐' },
];

export const POPULAR_WEB_PUBLISH_CHANNELS = [
  { id: 'Main Website', label: 'Main Website', icon: '🌐' },
  { id: 'WordPress', label: 'WordPress Blog', icon: '📝' },
  { id: 'Medium', label: 'Medium Article', icon: '✍️' },
  { id: 'Substack', label: 'Substack Newsletter', icon: '📰' },
  { id: 'LinkedIn Article', label: 'LinkedIn Article', icon: '💼' },
  { id: 'Google Search Console', label: 'Google Search Console', icon: '🔍' },
  { id: 'Web Story', label: 'Google Web Story', icon: '📱' },
  { id: 'Client Gallery', label: 'Client Gallery Blog', icon: '🖼️' },
];

export interface SocialPost {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  postType: 'Reel' | 'Story' | 'Carousel' | 'Static Post' | 'YouTube Short' | 'Other';
  concept: string;
  caption?: string;
  hashtags?: string;
  status: 'Planned' | 'In Progress' | 'Approved' | 'Scheduled' | 'Posted' | 'Pending';
  mediaUrl?: string;
  notes?: string;
  frequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Custom Date';
  platform?: SocialAccount['platform'];
  postedPlatforms?: string[];
}

export interface WebContentAttachment {
  id: string;
  name: string;
  url: string;
  size?: string | number;
  type?: string;
}

export interface WebContentPost {
  id: string;
  websiteId: string;
  title: string;
  subCategory?: string;
  focusKeywords?: string;
  contentType: 'Off page' | 'On page' | 'Monthly report';
  metaDescription?: string;
  date: string; // YYYY-MM-DD
  frequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Custom Date';
  status: 'Planned' | 'In Progress' | 'Scheduled' | 'Posted' | 'Pending';
  publishedChannels?: string[];
  attachments?: WebContentAttachment[];
}

export const WEB_SUB_CATEGORIES: Record<'Off page' | 'On page' | 'Monthly report', string[]> = {
  'Off page': [
    'Backlink Creation & Guest Posting',
    'Social Bookmarking',
    'Profile & Citation Creation',
    'Image Submission',
    'Video Submission',
    'Blog Update',
    'Google Webmaster',
    'Press Release & News Submission',
    'Forum & Quora Discussions',
    'Web 2.0 Submissions',
    'Directory & Local Business Listing',
    'Infographic & Image Backlinks',
    'Other'
  ],
  'On page': [
    'Blog Update',
    'Google Webmaster',
    'Title & Meta Description Optimization',
    'Content Writing & Keyword Optimization',
    'Image Alt Text & Compression',
    'Internal Linking & URL Structure',
    'Schema Markup & Rich Snippets',
    'Page Speed & Technical Audit Fixes',
    'Heading Tags (H1, H2, H3) Structuring',
    'Other'
  ],
  'Monthly report': [
    'SEO Ranking & Organic Traffic Audit',
    'Backlink & Domain Authority Report',
    'Google Search Console & Analytics Review',
    'Competitor SEO Analysis Report',
    'Lead Conversion & ROI Summary',
    'Monthly SEO Action Plan & Strategy',
    'Other'
  ]
};

const DEFAULT_WEB_DOMAINS: WebsiteDomain[] = [
  {
    id: 'web-1',
    siteName: `${BRAND.name} Official Blog`,
    url: `${BRAND.domain}/blog`,
    type: 'WordPress',
    monthlyGoal: 8,
    notes: '📌 Primary SEO Blog for Destination Weddings.\n- Focus on Udaipur, Jaipur & Goa venue reviews & photography guides.\n- Target 8 high-quality articles per month.\n- Ensure all images have proper alt tags.',
    tasks: [
      { id: 't1-1', text: 'Optimize H1, H2 tags & meta descriptions for Udaipur blog', completed: true, priority: 'High' },
      { id: 't1-2', text: 'Submit 5 Web 2.0 & Image backlinks on Medium', completed: false, priority: 'High' },
      { id: 't1-3', text: 'Review Google Search Console indexing errors', completed: false, priority: 'Medium' }
    ],
    keywords: [
      { id: 'k1-1', keyword: 'Udaipur Wedding Photographer', targetUrl: '/udaipur-wedding-photographer', searchVolume: '12.5K/mo', difficulty: 'High', status: 'Ranking In Top 10' },
      { id: 'k1-2', keyword: 'Best Pre Wedding Shoot Locations Rajasthan', targetUrl: '/pre-wedding-locations', searchVolume: '8.2K/mo', difficulty: 'Medium', status: 'Top 3' },
      { id: 'k1-3', keyword: 'Destination Wedding Photography Cost', targetUrl: '/destination-wedding-cost', searchVolume: '15.1K/mo', difficulty: 'High', status: 'Targeted' }
    ],
    attachments: [
      {
        id: 'att-demo-1',
        name: 'Udaipur_Venue_Guide_Cover.jpg',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
        type: 'image/jpeg',
        size: 245000
      },
      {
        id: 'att-demo-2',
        name: 'SEO_Keyword_Audit_Report_2026.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        type: 'application/pdf',
        size: 512000
      }
    ],
    color: 'bg-emerald-500'
  },
  {
    id: 'web-2',
    siteName: 'Royal Wedding Stories Portfolio',
    url: 'demo-weddings.example',
    type: 'Custom React/Next.js',
    monthlyGoal: 6,
    notes: '📌 High-res client photo stories, cinematic trailers & bride testimonials.\n- Maintain fast page speed loading under 2 seconds.\n- Add Schema Video markup.',
    tasks: [
      { id: 't2-1', text: 'Add Schema markup for VideoObject on client stories', completed: true, priority: 'High' },
      { id: 't2-2', text: 'Upload 10 new high-res wedding album gallery photos', completed: false, priority: 'High' }
    ],
    keywords: [
      { id: 'k2-1', keyword: 'Royal Wedding Photo Story Jaipur', targetUrl: '/royal-weddings', searchVolume: '3.8K/mo', difficulty: 'Medium', status: 'Top 3' },
      { id: 'k2-2', keyword: '4K Wedding Teaser Production India', targetUrl: '/wedding-films', searchVolume: '4.1K/mo', difficulty: 'Medium', status: 'Targeted' }
    ],
    color: 'bg-indigo-500'
  },
  {
    id: 'web-3',
    siteName: 'Demo Studio News',
    url: 'demo-studio.example/news',
    type: 'Medium / Substack',
    monthlyGoal: 4,
    notes: '📌 Studio news, camera gear reviews, industry awards & behind-the-scenes.',
    tasks: [
      { id: 't3-1', text: 'Write behind-the-scenes blog on Sony A7SIII video workflow', completed: false, priority: 'Medium' },
      { id: 't3-2', text: 'Share latest wedding teaser links on Substack newsletter', completed: true, priority: 'Low' }
    ],
    keywords: [
      { id: 'k3-1', keyword: 'Demo Studio Wedding Filmography', targetUrl: '/about-us', searchVolume: '2.4K/mo', difficulty: 'Low', status: 'Top 3' }
    ],
    color: 'bg-amber-500'
  }
];

const DEFAULT_WEB_POSTS: WebContentPost[] = [
  {
    id: 'web-post-1',
    websiteId: 'web-1',
    title: 'Top 15 Destination Pre-Wedding Photoshoot Spots in Udaipur (2026 Guide)',
    subCategory: 'Backlink Creation & Guest Posting',
    focusKeywords: 'Udaipur Wedding Photographer, Pre-Wedding Locations, Rajasthan Wedding',
    contentType: 'Off page',
    metaDescription: 'Discover dreamy sunset palaces and lakeside spots for pre-wedding shoots in Udaipur.',
    date: '2026-08-05',
    status: 'Posted',
    publishedChannels: ['Main Website', 'WordPress', 'Google Search Console']
  },
  {
    id: 'web-post-2',
    websiteId: 'web-2',
    title: 'Ananya & Rohan Jaipur Palace Wedding Film: Complete Royal Photo Story',
    subCategory: 'Content Writing & Keyword Optimization',
    focusKeywords: 'Jaipur Royal Wedding, Luxury Wedding Photographer, Palace Wedding Film',
    contentType: 'On page',
    metaDescription: 'A cinematic walkthrough of Rohan & Ananya’s 3-day royal wedding at City Palace Jaipur.',
    date: '2026-08-14',
    status: 'Pending',
    publishedChannels: ['Main Website']
  },
  {
    id: 'web-post-3',
    websiteId: 'web-3',
    title: 'Why 4K Drone Videography & Slog-3 Color Grading Define Modern Weddings',
    subCategory: 'SEO Ranking & Organic Traffic Audit',
    focusKeywords: 'Drone Videography, Wedding Editing, Demo Studio',
    contentType: 'Monthly report',
    metaDescription: 'How our cinematography crew captures 4K aerial shots and cinematic color palettes.',
    date: '2026-08-22',
    status: 'Pending',
    publishedChannels: []
  }
];

const DEFAULT_ACCOUNTS: SocialAccount[] = [
  {
    id: 'acc-1',
    clientName: 'Demo Studio Official',
    handle: '@demostudio',
    platform: 'Instagram',
    monthlyGoal: 20,
    notes: 'Main brand page. Focus on luxury cinematic wedding teasers & reels.',
    color: 'bg-pink-500'
  },
  {
    id: 'acc-2',
    clientName: 'Rohan & Ananya Wedding',
    handle: '@rohan_ananya_moments',
    platform: 'Instagram',
    monthlyGoal: 12,
    notes: 'Teasers, Sangeet highlights, Haldi reels.',
    color: 'bg-purple-500'
  },
  {
    id: 'acc-3',
    clientName: 'Demo YouTube Channel',
    handle: 'Demo Wedding Films',
    platform: 'YouTube',
    monthlyGoal: 6,
    notes: '4K Full Wedding Teasers & Shorts',
    color: 'bg-red-500'
  }
];

const DEFAULT_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    accountId: 'acc-1',
    date: '2026-08-02',
    postType: 'Reel',
    concept: 'Cinematic Phere Slow-mo in 4K',
    caption: 'Pure magic captured during sunset phere ✨ #WeddingFilm #DemoFilms',
    hashtags: '#cinematicwedding #weddingreels #indianwedding',
    status: 'Posted',
    mediaUrl: 'https://drive.google.com'
  },
  {
    id: 'post-2',
    accountId: 'acc-2',
    date: '2026-08-05',
    postType: 'Reel',
    concept: 'Sangeet High-Energy Punjabi Dhol Reel',
    caption: 'When the bride hits the dance floor! 💃🔥',
    hashtags: '#sangeetnight #bridaldance #weddingreels',
    status: 'Posted'
  },
  {
    id: 'post-3',
    accountId: 'acc-1',
    date: '2026-08-10',
    postType: 'Carousel',
    concept: 'Top 10 Bride Entry Moments Photo Series',
    caption: 'Which bride entry vibe is your favorite? 1-10 🌸',
    status: 'Scheduled'
  },
  {
    id: 'post-4',
    accountId: 'acc-3',
    date: '2026-08-15',
    postType: 'YouTube Short',
    concept: 'Teaser Reel: Jaipur Royal Palace Wedding',
    caption: 'Full film dropping this Sunday on YouTube! 👑',
    status: 'In Progress'
  },
  {
    id: 'post-5',
    accountId: 'acc-2',
    date: '2026-08-18',
    postType: 'Reel',
    concept: 'Haldi Yellow Aesthetic Smoke Reel',
    caption: 'Joy & Haldi colors in full glow 💛✨',
    status: 'Planned'
  }
];

interface SocialMediaCalendarWidgetProps {
  assignedTasks?: TeamTask[];
  onUpdateTask?: (task: TeamTask) => void;
  onAddTask?: (task: TeamTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (task: TeamTask) => void;
  activeMemberName?: string;
}

export const SocialMediaCalendarWidget: React.FC<SocialMediaCalendarWidgetProps> = ({
  assignedTasks = [],
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onEditTask,
  activeMemberName
}) => {
  // Hub Tab Switcher
  const [activeHubTab, setActiveHubTab] = useState<'social' | 'website'>('website');

  // Persistence Keys
  const STORAGE_KEY_ACCOUNTS = `${BRAND.cookiePrefix}_social_accounts_v2`;
  const STORAGE_KEY_POSTS = `${BRAND.cookiePrefix}_social_calendar_posts_v2`;
  const STORAGE_KEY_WEB_DOMAINS = `${BRAND.cookiePrefix}_web_domains_v2`;
  const STORAGE_KEY_WEB_POSTS = `${BRAND.cookiePrefix}_web_calendar_posts_v2`;

  // Social State
  const [accounts, setAccounts] = useState<SocialAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  const [posts, setPosts] = useState<SocialPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSTS);
      return saved ? JSON.parse(saved) : DEFAULT_POSTS;
    } catch {
      return DEFAULT_POSTS;
    }
  });

  // Website State
  const [webDomains, setWebDomains] = useState<WebsiteDomain[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WEB_DOMAINS);
      return saved ? JSON.parse(saved) : DEFAULT_WEB_DOMAINS;
    } catch {
      return DEFAULT_WEB_DOMAINS;
    }
  });

  const [webPosts, setWebPosts] = useState<WebContentPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WEB_POSTS);
      return saved ? JSON.parse(saved) : DEFAULT_WEB_POSTS;
    } catch {
      return DEFAULT_WEB_POSTS;
    }
  });

  // Current Date / Navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // Default Aug 2026 matching app context
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Website Filters
  const [selectedWebDomainId, setSelectedWebDomainId] = useState<string>('all');
  const [selectedWebContentTypeFilter, setSelectedWebContentTypeFilter] = useState<string>('all');
  const [selectedWebStatusFilter, setSelectedWebStatusFilter] = useState<string>('all');

  // Modal States - Social
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);
  const [deleteConfirmAcc, setDeleteConfirmAcc] = useState<SocialAccount | null>(null);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [defaultPostDate, setDefaultPostDate] = useState<string>('');
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<SocialPost | null>(null);

  // Modal States - Website
  const [isWebDomainModalOpen, setIsWebDomainModalOpen] = useState(false);
  const [editingWebDomain, setEditingWebDomain] = useState<WebsiteDomain | null>(null);
  const [deleteConfirmWebDomain, setDeleteConfirmWebDomain] = useState<WebsiteDomain | null>(null);

  const [isWebPostModalOpen, setIsWebPostModalOpen] = useState(false);
  const [editingWebPost, setEditingWebPost] = useState<WebContentPost | null>(null);
  const [deleteConfirmWebPost, setDeleteConfirmWebPost] = useState<WebContentPost | null>(null);

  // Form States for Social Account
  const [accClientName, setAccClientName] = useState('');
  const [accHandle, setAccHandle] = useState('');
  const [accPlatform, setAccPlatform] = useState<SocialAccount['platform']>('Instagram');
  const [accGoal, setAccGoal] = useState<number>(15);
  const [accNotes, setAccNotes] = useState('');

  // Form States for Social Post
  const [postAccountId, setPostAccountId] = useState('');
  const [postPlatform, setPostPlatform] = useState<SocialAccount['platform']>('Instagram');
  const [postPostedPlatforms, setPostPostedPlatforms] = useState<string[]>([]);
  const [postDate, setPostDate] = useState('');
  const [postFrequency, setPostFrequency] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom Date'>('Custom Date');
  const [postType, setPostType] = useState<SocialPost['postType']>('Reel');
  const [postConcept, setPostConcept] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postHashtags, setPostHashtags] = useState('');
  const [postStatus, setPostStatus] = useState<SocialPost['status']>('Planned');
  const [postMediaUrl, setPostMediaUrl] = useState('');

  // Form States for Web Domain
  const [webSiteName, setWebSiteName] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webType, setWebType] = useState<WebsiteDomain['type']>('WordPress');
  const [webMonthlyGoal, setWebMonthlyGoal] = useState<number>(8);
  const [webNotes, setWebNotes] = useState('');

  // Form States for Web Post
  const [webPostWebsiteId, setWebPostWebsiteId] = useState('');
  const [webPostTitle, setWebPostTitle] = useState('');
  const [webPostSubCategory, setWebPostSubCategory] = useState('');
  const [webPostFocusKeywords, setWebPostFocusKeywords] = useState('');
  const [webPostContentType, setWebPostContentType] = useState<WebContentPost['contentType']>('Off page');
  const [webPostMetaDescription, setWebPostMetaDescription] = useState('');
  const [webPostDate, setWebPostDate] = useState('');
  const [webPostFrequency, setWebPostFrequency] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom Date'>('Custom Date');
  const [webPostStatus, setWebPostStatus] = useState<WebContentPost['status']>('Pending');
  const [webPostPublishedChannels, setWebPostPublishedChannels] = useState<string[]>([]);
  const [webPostAttachments, setWebPostAttachments] = useState<WebContentAttachment[]>([]);

  // Domain Workspace Tool States
  const [activeDomainWorkspaceTab, setActiveDomainWorkspaceTab] = useState<'notepad' | 'tasks' | 'keywords' | 'files'>('notepad');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  const [newKwName, setNewKwName] = useState('');
  const [newKwTargetUrl, setNewKwTargetUrl] = useState('');
  const [newKwSearchVol, setNewKwSearchVol] = useState('');
  const [newKwDifficulty, setNewKwDifficulty] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newKwStatus, setNewKwStatus] = useState<'Targeted' | 'Ranking In Top 10' | 'Top 3' | 'Planned'>('Targeted');

  // Handlers for Domain Workspace
  const handleUpdateDomainNotes = (domainId: string, notesText: string) => {
    setWebDomains((prev) =>
      prev.map((d) => (d.id === domainId ? { ...d, notes: notesText } : d))
    );
  };

  const handleAddTaskToDomain = (domainId: string) => {
    if (!newTaskText.trim()) return;
    const task: DomainTask = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
      createdAt: new Date().toISOString()
    };
    setWebDomains((prev) =>
      prev.map((d) =>
        d.id === domainId
          ? { ...d, tasks: [...(d.tasks || []), task] }
          : d
      )
    );
    setNewTaskText('');
  };

  const handleToggleDomainTask = (domainId: string, taskId: string) => {
    setWebDomains((prev) =>
      prev.map((d) =>
        d.id === domainId
          ? {
              ...d,
              tasks: (d.tasks || []).map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              )
            }
          : d
      )
    );
  };

  const handleDeleteDomainTask = (domainId: string, taskId: string) => {
    setWebDomains((prev) =>
      prev.map((d) =>
        d.id === domainId
          ? {
              ...d,
              tasks: (d.tasks || []).filter((t) => t.id !== taskId)
            }
          : d
      )
    );
  };

  const handleAddKeywordToDomain = (domainId: string) => {
    if (!newKwName.trim()) return;
    const kw: TargetingKeyword = {
      id: `kw-${Date.now()}`,
      keyword: newKwName.trim(),
      targetUrl: newKwTargetUrl.trim(),
      searchVolume: newKwSearchVol.trim(),
      difficulty: newKwDifficulty,
      status: newKwStatus
    };
    setWebDomains((prev) =>
      prev.map((d) =>
        d.id === domainId
          ? { ...d, keywords: [...(d.keywords || []), kw] }
          : d
      )
    );
    setNewKwName('');
    setNewKwTargetUrl('');
    setNewKwSearchVol('');
  };

  const handleDeleteDomainKeyword = (domainId: string, kwId: string) => {
    setWebDomains((prev) =>
      prev.map((d) =>
        d.id === domainId
          ? {
              ...d,
              keywords: (d.keywords || []).filter((k) => k.id !== kwId)
            }
          : d
      )
    );
  };

  const handleAddDomainAttachment = (domainId: string, attachment: WebContentAttachment) => {
    setWebDomains((prev) =>
      prev.map((d) =>
        d.id === domainId
          ? { ...d, attachments: [...(d.attachments || []), attachment] }
          : d
      )
    );
  };

  const handleDeleteDomainAttachment = (domainId: string, attachmentId: string) => {
    setWebDomains((prev) =>
      prev.map((d) =>
        d.id === domainId
          ? {
              ...d,
              attachments: (d.attachments || []).filter((a) => a.id !== attachmentId)
            }
          : d
      )
    );
  };

  // Save to LocalStorage - Social
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error(e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    } catch (e) {
      console.error(e);
    }
  }, [posts]);

  // Save to LocalStorage - Website
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WEB_DOMAINS, JSON.stringify(webDomains));
    } catch (e) {
      console.error(e);
    }
  }, [webDomains]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WEB_POSTS, JSON.stringify(webPosts));
    } catch (e) {
      console.error(e);
    }
  }, [webPosts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    } catch (e) {
      console.error(e);
    }
  }, [posts]);

  // Handlers for Accounts
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccClientName('');
    setAccHandle('');
    setAccPlatform('Instagram');
    setAccGoal(15);
    setAccNotes('');
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accClientName.trim()) return;

    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editingAccount.id
            ? {
                ...a,
                clientName: accClientName,
                handle: accHandle,
                platform: accPlatform,
                monthlyGoal: accGoal,
                notes: accNotes
              }
            : a
        )
      );
    } else {
      const colors = ['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newAcc: SocialAccount = {
        id: `acc-${Date.now()}`,
        clientName: accClientName,
        handle: accHandle.startsWith('@') || accPlatform === 'YouTube' ? accHandle : `@${accHandle}`,
        platform: accPlatform,
        monthlyGoal: Number(accGoal) || 12,
        notes: accNotes,
        color: randomColor
      };
      setAccounts((prev) => [...prev, newAcc]);
    }

    setIsAccountModalOpen(false);
  };

  const handleDeleteAccount = (accId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accId));
    setPosts((prev) => prev.filter((p) => p.accountId !== accId));
    if (selectedAccountId === accId) {
      setSelectedAccountId('all');
    }
  };

  // Handlers for Website Domains
  const handleOpenAddWebDomain = () => {
    setEditingWebDomain(null);
    setWebSiteName('');
    setWebUrl('');
    setWebType('WordPress');
    setWebMonthlyGoal(8);
    setWebNotes('');
    setIsWebDomainModalOpen(true);
  };

  const handleOpenEditWebDomain = (dom: WebsiteDomain) => {
    setEditingWebDomain(dom);
    setWebSiteName(dom.siteName);
    setWebUrl(dom.url);
    setWebType(dom.type);
    setWebMonthlyGoal(dom.monthlyGoal);
    setWebNotes(dom.notes || '');
    setIsWebDomainModalOpen(true);
  };

  const handleSaveWebDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webSiteName.trim() || !webUrl.trim()) return;

    if (editingWebDomain) {
      setWebDomains((prev) =>
        prev.map((d) =>
          d.id === editingWebDomain.id
            ? {
                ...d,
                siteName: webSiteName.trim(),
                url: webUrl.trim(),
                type: webType,
                monthlyGoal: Number(webMonthlyGoal) || 1,
                notes: webNotes.trim()
              }
            : d
        )
      );
    } else {
      const colors = ['bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500'];
      const newDom: WebsiteDomain = {
        id: `web-${Date.now()}`,
        siteName: webSiteName.trim(),
        url: webUrl.trim(),
        type: webType,
        monthlyGoal: Number(webMonthlyGoal) || 1,
        notes: webNotes.trim(),
        color: colors[webDomains.length % colors.length]
      };
      setWebDomains((prev) => [...prev, newDom]);
    }

    setIsWebDomainModalOpen(false);
  };

  const handleDeleteWebDomain = (domId: string) => {
    setWebDomains((prev) => prev.filter((d) => d.id !== domId));
    setWebPosts((prev) => prev.filter((p) => p.websiteId !== domId));
    if (selectedWebDomainId === domId) {
      setSelectedWebDomainId('all');
    }
  };

  // Handlers for Website Posts
  const handleOpenAddWebPost = (initialDate?: string) => {
    setEditingWebPost(null);
    const activeDomain = webDomains.find((d) => d.id === selectedWebDomainId) || webDomains[0];
    const activeWebId = activeDomain?.id || '';
    setWebPostWebsiteId(activeWebId);
    setWebPostTitle('');
    setWebPostSubCategory('');
    setWebPostFocusKeywords('');
    setWebPostContentType('Off page');
    setWebPostMetaDescription('');
    setWebPostPublishedChannels([]);
    setWebPostAttachments([]);
    const todayStr = initialDate || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
    setWebPostDate(todayStr);
    setWebPostFrequency('Custom Date');
    setWebPostStatus('Pending');
    setIsWebPostModalOpen(true);
  };

  const handleOpenEditWebPost = (post: WebContentPost) => {
    setEditingWebPost(post);
    setWebPostWebsiteId(post.websiteId);
    setWebPostTitle(post.title);
    setWebPostSubCategory(post.subCategory || '');
    setWebPostFocusKeywords(post.focusKeywords || '');
    setWebPostContentType(post.contentType);
    setWebPostMetaDescription(post.metaDescription || '');
    setWebPostPublishedChannels(post.publishedChannels || (post.status === 'Posted' ? ['Main Website'] : []));
    setWebPostAttachments(post.attachments || []);
    setWebPostDate(post.date);
    setWebPostFrequency(post.frequency || 'Custom Date');
    setWebPostStatus(post.status);
    setIsWebPostModalOpen(true);
  };

  const handleSaveWebPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webPostDate) return;

    const defaultTitle = webPostSubCategory.trim() || `${webPostContentType} Work`;
    const finalTitle = webPostTitle.trim() || defaultTitle;

    if (editingWebPost) {
      setWebPosts((prev) =>
        prev.map((p) =>
          p.id === editingWebPost.id
            ? {
                ...p,
                websiteId: webPostWebsiteId,
                title: finalTitle,
                subCategory: webPostSubCategory.trim(),
                focusKeywords: webPostFocusKeywords.trim(),
                contentType: webPostContentType,
                metaDescription: webPostMetaDescription.trim(),
                publishedChannels: webPostPublishedChannels,
                attachments: webPostAttachments,
                date: webPostDate,
                status: webPostStatus,
                frequency: webPostFrequency
              }
            : p
        )
      );
    } else {
      const newPost: WebContentPost = {
        id: `web-post-${Date.now()}`,
        websiteId: webPostWebsiteId,
        title: finalTitle,
        subCategory: webPostSubCategory.trim(),
        focusKeywords: webPostFocusKeywords.trim(),
        contentType: webPostContentType,
        metaDescription: webPostMetaDescription.trim(),
        publishedChannels: webPostPublishedChannels,
        attachments: webPostAttachments,
        date: webPostDate,
        status: webPostStatus,
        frequency: webPostFrequency
      };
      setWebPosts((prev) => [...prev, newPost]);
    }

    setIsWebPostModalOpen(false);
  };

  const handleToggleWebPostChannel = (postId: string, channelId: string) => {
    setWebPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const current = p.publishedChannels || (p.status === 'Posted' ? ['Main Website'] : []);
          const exists = current.includes(channelId);
          const nextChannels = exists
            ? current.filter((ch) => ch !== channelId)
            : [...current, channelId];

          return {
            ...p,
            publishedChannels: nextChannels,
            status: nextChannels.length > 0 ? 'Posted' : 'Pending',
          };
        }
        return p;
      })
    );
  };

  const handleToggleWebPostStatus = (postId: string) => {
    setWebPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextStatus: WebContentPost['status'] = p.status === 'Posted' ? 'Pending' : 'Posted';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const handleDeleteWebPost = (postId: string) => {
    setWebPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Handlers for Posts
  const handleOpenAddPost = (initialDate?: string) => {
    setEditingPost(null);
    const activeAcc = (selectedAccountId && selectedAccountId !== 'all') ? selectedAccountId : (accounts[0]?.id || '');
    const targetAcc = accounts.find((a) => a.id === activeAcc);
    setPostAccountId(activeAcc);
    setPostPlatform(targetAcc?.platform || 'Instagram');
    setPostPostedPlatforms([]);
    const todayStr = initialDate || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
    setPostDate(todayStr);
    setPostFrequency('Custom Date');
    setPostType('Reel');
    setPostConcept('');
    setPostCaption('');
    setPostHashtags('');
    setPostStatus('Pending');
    setPostMediaUrl('');
    setIsPostModalOpen(true);
  };

  const handleOpenEditPost = (post: SocialPost) => {
    setEditingPost(post);
    setPostAccountId(post.accountId);
    const accObj = accounts.find((a) => a.id === post.accountId);
    setPostPlatform(post.platform || accObj?.platform || 'Instagram');
    setPostPostedPlatforms(post.postedPlatforms || (post.status === 'Posted' ? [post.platform || accObj?.platform || 'Instagram'] : []));
    setPostDate(post.date);
    setPostFrequency(post.frequency || 'Custom Date');
    setPostType(post.postType);
    setPostConcept(post.concept);
    setPostCaption(post.caption || '');
    setPostHashtags(post.hashtags || '');
    setPostStatus(post.status);
    setPostMediaUrl(post.mediaUrl || '');
    setIsPostModalOpen(true);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postConcept.trim() || !postDate) return;

    if (editingPost) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? {
                ...p,
                accountId: postAccountId,
                platform: postPlatform,
                postedPlatforms: postPostedPlatforms,
                date: postDate,
                postType,
                concept: postConcept,
                caption: postCaption,
                hashtags: postHashtags,
                status: postStatus,
                mediaUrl: postMediaUrl,
                frequency: postFrequency
              }
            : p
        )
      );
    } else {
      if (postFrequency === 'Daily') {
        const newPostsList: SocialPost[] = [];
        const startParts = postDate.split('-').map(Number);
        const startYear = startParts[0];
        const startMonth = startParts[1] - 1;
        const startDay = startParts[2];
        const daysInMonth = new Date(startYear, startMonth + 1, 0).getDate();

        const limitDay = daysInMonth;
        let count = 1;
        for (let d = startDay; d <= limitDay; d++) {
          const dStr = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          newPostsList.push({
            id: `post-${Date.now()}-${d}`,
            accountId: postAccountId,
            platform: postPlatform,
            postedPlatforms: postPostedPlatforms,
            date: dStr,
            postType,
            concept: count === 1 ? postConcept : `${postConcept} (Day ${count})`,
            caption: postCaption,
            hashtags: postHashtags,
            status: postStatus,
            mediaUrl: postMediaUrl,
            frequency: 'Daily'
          });
          count++;
        }
        setPosts((prev) => [...prev, ...newPostsList]);
      } else if (postFrequency === 'Weekly') {
        const newPostsList: SocialPost[] = [];
        const startParts = postDate.split('-').map(Number);
        const startYear = startParts[0];
        const startMonth = startParts[1] - 1;
        const startDay = startParts[2];
        const daysInMonth = new Date(startYear, startMonth + 1, 0).getDate();

        let currDay = startDay;
        let weekNum = 1;
        while (currDay <= daysInMonth) {
          const dStr = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(currDay).padStart(2, '0')}`;
          newPostsList.push({
            id: `post-${Date.now()}-w${weekNum}`,
            accountId: postAccountId,
            platform: postPlatform,
            postedPlatforms: postPostedPlatforms,
            date: dStr,
            postType,
            concept: weekNum === 1 ? postConcept : `${postConcept} (Week ${weekNum})`,
            caption: postCaption,
            hashtags: postHashtags,
            status: postStatus,
            mediaUrl: postMediaUrl,
            frequency: 'Weekly'
          });
          currDay += 7;
          weekNum++;
        }
        setPosts((prev) => [...prev, ...newPostsList]);
      } else {
        const newPost: SocialPost = {
          id: `post-${Date.now()}`,
          accountId: postAccountId,
          platform: postPlatform,
          postedPlatforms: postPostedPlatforms,
          date: postDate,
          postType,
          concept: postConcept,
          caption: postCaption,
          hashtags: postHashtags,
          status: postStatus,
          mediaUrl: postMediaUrl,
          frequency: postFrequency
        };
        setPosts((prev) => [...prev, newPost]);
      }
    }

    setIsPostModalOpen(false);
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setIsPostModalOpen(false);
  };

  const handleTogglePostStatus = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextStatus: SocialPost['status'] = p.status === 'Posted' ? 'Pending' : 'Posted';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const handleTogglePostPlatform = (postId: string, platformId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const acc = accounts.find((a) => a.id === p.accountId);
          const current = p.postedPlatforms || (p.status === 'Posted' ? [p.platform || acc?.platform || 'Instagram'] : []);
          const exists = current.includes(platformId);
          const nextPlatforms = exists
            ? current.filter((plat) => plat !== platformId)
            : [...current, platformId];

          return {
            ...p,
            postedPlatforms: nextPlatforms,
            status: nextPlatforms.length > 0 ? 'Posted' : 'Pending',
          };
        }
        return p;
      })
    );
  };

  // Navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  // Filter posts for current month and selection
  const yearMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const filteredPosts = posts.filter((p) => {
    const isCurrentMonth = p.date.startsWith(yearMonthPrefix);
    const matchesAccount = selectedAccountId === 'all' || p.accountId === selectedAccountId;
    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'Posted'
        ? p.status === 'Posted'
        : selectedStatusFilter === 'Pending'
        ? p.status !== 'Posted'
        : p.status === selectedStatusFilter);
    const acc = accounts.find((a) => a.id === p.accountId);
    const matchesPlatform = selectedPlatformFilter === 'all' || (acc && (acc.platform === selectedPlatformFilter || acc.platform === 'All'));
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.concept.toLowerCase().includes(q) ||
      (p.caption && p.caption.toLowerCase().includes(q)) ||
      (p.postType && p.postType.toLowerCase().includes(q)) ||
      (acc && (acc.clientName.toLowerCase().includes(q) || acc.handle.toLowerCase().includes(q)));
    return isCurrentMonth && matchesAccount && matchesStatus && matchesPlatform && matchesSearch;
  });

  // Calculate posts count per account for progress
  const getAccountPostCount = (accId: string) => {
    return posts.filter((p) => p.accountId === accId && p.date.startsWith(yearMonthPrefix)).length;
  };

  const getAccountPostedCount = (accId: string) => {
    return posts.filter((p) => p.accountId === accId && p.date.startsWith(yearMonthPrefix) && p.status === 'Posted').length;
  };

  // Filter website posts for current month and selection
  const filteredWebPosts = webPosts.filter((p) => {
    const isCurrentMonth = p.date.startsWith(yearMonthPrefix);
    const matchesDomain = selectedWebDomainId === 'all' || p.websiteId === selectedWebDomainId;
    const matchesContentType = selectedWebContentTypeFilter === 'all' || p.contentType === selectedWebContentTypeFilter;
    const matchesStatus =
      selectedWebStatusFilter === 'all' ||
      (selectedWebStatusFilter === 'Posted'
        ? p.status === 'Posted'
        : selectedWebStatusFilter === 'Pending'
        ? p.status !== 'Posted'
        : p.status === selectedWebStatusFilter);
    const dom = webDomains.find((d) => d.id === p.websiteId);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
      (p.focusKeywords && p.focusKeywords.toLowerCase().includes(q)) ||
      (p.metaDescription && p.metaDescription.toLowerCase().includes(q)) ||
      (dom && (dom.siteName.toLowerCase().includes(q) || dom.url.toLowerCase().includes(q)));
    return isCurrentMonth && matchesDomain && matchesContentType && matchesStatus && matchesSearch;
  });

  const getWebDomainPostCount = (domId: string) => {
    return webPosts.filter((p) => p.websiteId === domId && p.date.startsWith(yearMonthPrefix)).length;
  };

  const getWebDomainPostedCount = (domId: string) => {
    return webPosts.filter((p) => p.websiteId === domId && p.date.startsWith(yearMonthPrefix) && p.status === 'Posted').length;
  };

  // Platform icon helper
  const getPlatformIcon = (platform: SocialAccount['platform']) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'YouTube':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'Facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'LinkedIn':
        return <span className="text-xs font-bold text-sky-700 bg-sky-50 px-1 py-0.5 rounded">💼 LinkedIn</span>;
      case 'Pinterest':
        return <span className="text-xs font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">📌 Pinterest</span>;
      case 'X':
        return <span className="text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">𝕏</span>;
      case 'GMB':
        return <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">📍 GMB</span>;
      case 'Tumblr':
        return <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">🌀 Tumblr</span>;
      case 'TikTok':
        return <span className="text-xs font-bold text-black bg-slate-100 px-1 py-0.5 rounded">🎵 TikTok</span>;
      case 'Threads':
        return <span className="text-xs font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded">🧵 Threads</span>;
      case 'Snapchat':
        return <span className="text-xs font-bold text-amber-700 bg-yellow-100 px-1 py-0.5 rounded">👻 Snapchat</span>;
      case 'WhatsApp':
        return <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">💬 WhatsApp</span>;
      case 'Telegram':
        return <span className="text-xs font-bold text-sky-600 bg-sky-50 px-1 py-0.5 rounded">✈️ Telegram</span>;
      case 'Reddit':
        return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-1 py-0.5 rounded">🤖 Reddit</span>;
      case 'Medium':
        return <span className="text-xs font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">✍️ Medium</span>;
      case 'Website':
        return <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">🌐 Website</span>;
      case 'All':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Globe className="w-4 h-4 text-indigo-600" />;
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: SocialPost['status'], onClick?: (e: React.MouseEvent) => void) => {
    const isPosted = status === 'Posted';
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
          isPosted
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
            : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
        }`}
        title="Click to toggle status (Pending / Posted)"
      >
        {isPosted ? '✓ Posted' : '⏳ Pending'}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
      {/* 0. TOP HUB TAB SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveHubTab('social')}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeHubTab === 'social'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Share2 className="w-4 h-4 text-pink-600" />
            <span>📱 Social Media Accounts & Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHubTab('website')}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeHubTab === 'website'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>🌐 Website & Blog Content Calendar</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-2">
          <span>Active Hub:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold">
            {activeHubTab === 'social' ? 'Social Handles & Reels' : 'Websites, Blogs & SEO Articles'}
          </span>
        </div>
      </div>

      {activeHubTab === 'social' && (
        <div className="space-y-6">
          {/* 1. SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Social Media Accounts & Monthly Calendar
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Manage client handles, set post targets & schedule monthly content deliverables
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddAccount}
            className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Social Account</span>
          </button>

          <button
            onClick={() => handleOpenAddPost()}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Schedule New Post</span>
          </button>
        </div>
      </div>

      {/* 3. MONTHLY CALENDAR CONTROL BAR */}
      <div className="pt-2 border-t border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          
          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-extrabold text-slate-900 min-w-[130px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filters & View Switcher */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Search Input Box */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-6 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-44 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Platform Filter Dropdown */}
            <select
              value={selectedPlatformFilter}
              onChange={(e) => setSelectedPlatformFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">🌐 All Platforms</option>
              <option value="Instagram">📷 Instagram</option>
              <option value="YouTube">▶ YouTube</option>
              <option value="Facebook">👍 Facebook</option>
              <option value="LinkedIn">💼 LinkedIn</option>
              <option value="Pinterest">📌 Pinterest</option>
              <option value="X">𝕏 X (Twitter)</option>
              <option value="GMB">📍 GMB (Google Business)</option>
              <option value="Tumblr">🌀 Tumblr</option>
              <option value="TikTok">🎵 TikTok</option>
              <option value="Threads">🧵 Threads</option>
              <option value="Snapchat">👻 Snapchat</option>
              <option value="WhatsApp">💬 WhatsApp</option>
              <option value="Telegram">✈️ Telegram</option>
              <option value="Reddit">🤖 Reddit</option>
              <option value="Medium">✍️ Medium</option>
              <option value="Website">🌐 Website / Blog</option>
              <option value="Other">🌐 Other</option>
            </select>

            {/* Status Filter Dropdown */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Posted">✓ Posted</option>
            </select>

            {/* View Mode Toggle Buttons */}
            <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Planner List
              </button>
            </div>
          </div>
        </div>

        {/* 4. CALENDAR GRID VIEW */}
        {viewMode === 'calendar' ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-2 text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-200">
              {/* Empty leading padding days */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[90px] p-1.5" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                
                // Get posts on this day
                const dayPosts = filteredPosts.filter((p) => p.date === dateString);
                const isToday = new Date().toISOString().startsWith(dateString);

                return (
                  <div
                    key={dateString}
                    className={`bg-white min-h-[105px] p-1.5 flex flex-col justify-between transition group hover:bg-slate-50/80 ${
                      isToday ? 'bg-indigo-50/30 ring-2 ring-indigo-500/30 inset-0 z-1' : ''
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                        <span className={`px-1.5 py-0.5 rounded ${isToday ? 'bg-indigo-600 text-white font-extrabold' : ''}`}>
                          {dayNum}
                        </span>
                        <button
                          onClick={() => handleOpenAddPost(dateString)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-indigo-50 transition cursor-pointer"
                          title={`Add post on ${dateString}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Post Badges on Day */}
                      <div className="space-y-1">
                        {dayPosts.map((post) => {
                          const accountObj = accounts.find((a) => a.id === post.accountId);

                          return (
                            <div
                              key={post.id}
                              onClick={() => handleOpenEditPost(post)}
                              className="p-1 rounded bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-[10px] space-y-0.5 transition cursor-pointer shadow-2xs hover:border-indigo-300"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-indigo-700 truncate max-w-[70px] flex items-center gap-1">
                                  {getPlatformIcon(post.platform || accountObj?.platform || 'Instagram')}
                                  {accountObj ? accountObj.clientName.split(' ')[0] : 'Client'}
                                </span>
                                <div className="flex items-center gap-0.5">
                                  {post.frequency && post.frequency !== 'Custom Date' && (
                                    <span className="font-bold px-1 rounded bg-purple-100 text-purple-800 text-[8px]" title={`Schedule: ${post.frequency}`}>
                                      {post.frequency === 'Daily' ? '🔄' : post.frequency === 'Weekly' ? '🗓️' : '📅'}
                                    </span>
                                  )}
                                  <span className="font-bold px-1 rounded bg-slate-200 text-slate-700 text-[9px]">
                                    {post.postType}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmPost(post);
                                    }}
                                    className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                    title="Delete Post"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-800 font-medium truncate leading-tight">
                                {post.concept}
                              </p>
                              <div className="flex items-center justify-between pt-0.5">
                                {getStatusBadge(post.status, (e) => {
                                  e.stopPropagation();
                                  handleTogglePostStatus(post.id);
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Add link at bottom of day if empty */}
                    {dayPosts.length === 0 && (
                      <button
                        onClick={() => handleOpenAddPost(dateString)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-indigo-600 font-medium text-center py-1 border border-dashed border-slate-200 rounded hover:border-indigo-300 transition"
                      >
                        + Add Post
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 5. LIST PLANNER VIEW */
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {filteredPosts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">No social posts found for this month or selection.</p>
                <button
                  onClick={() => handleOpenAddPost()}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  + Schedule a post now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPosts
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((post) => {
                    const acc = accounts.find((a) => a.id === post.accountId);

                    return (
                      <div
                        key={post.id}
                        className="p-3.5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-center bg-slate-100 p-2 rounded-xl border border-slate-200 shrink-0 min-w-[50px]">
                            <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                              {new Date(post.date).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="text-base font-black text-slate-900 block leading-tight">
                              {new Date(post.date).getDate()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1.5">
                                {getPlatformIcon(post.platform || acc?.platform || 'Instagram')}
                                <span>{acc?.clientName || 'Unassigned'} ({acc?.handle})</span>
                              </span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {post.postType}
                              </span>
                              {post.frequency && post.frequency !== 'Custom Date' && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                  {post.frequency === 'Daily' && '🔄 Daily'}
                                  {post.frequency === 'Weekly' && '🗓️ Weekly'}
                                  {post.frequency === 'Monthly' && '📅 Monthly'}
                                </span>
                              )}
                              {getStatusBadge(post.status, (e) => {
                                e.stopPropagation();
                                handleTogglePostStatus(post.id);
                              })}
                            </div>

                            <h4 className="text-sm font-bold text-slate-900">{post.concept}</h4>
                            {post.caption && (
                              <p className="text-xs text-slate-500 italic line-clamp-1">"{post.caption}"</p>
                            )}

                            {/* Multi-Platform Published Status Bar */}
                            <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                              {POPULAR_POST_PLATFORMS.map((plat) => {
                                const isPostedOnThisPlat = (post.postedPlatforms || (post.status === 'Posted' ? [post.platform || acc?.platform || 'Instagram'] : [])).includes(plat.id);
                                return (
                                  <button
                                    key={plat.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTogglePostPlatform(post.id, plat.id);
                                    }}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border ${
                                      isPostedOnThisPlat
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-extrabold'
                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                    title={`${isPostedOnThisPlat ? 'Posted on' : 'Click to mark as posted on'} ${plat.label}`}
                                  >
                                    <span>{plat.icon}</span>
                                    <span>{plat.id}</span>
                                    {isPostedOnThisPlat && <span className="text-white font-black">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleTogglePostStatus(post.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                            title="Click to advance post status"
                          >
                            Advance Status
                          </button>
                          <button
                            onClick={() => handleOpenEditPost(post)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
                            title="Edit Post"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmPost(post)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition cursor-pointer"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )}

      {activeHubTab === 'website' && (
        /* WEBSITE CONTENT & MONTHLY BLOG CALENDAR TAB */
        <div className="space-y-6">
          {/* WEBSITE HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xs">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Website & Blog Content Calendar
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Manage website domains, track SEO blog publishing goals & schedule article deliverables
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddWebDomain}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Website Domain</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddWebPost()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Schedule Web Post</span>
              </button>
            </div>
          </div>

          {/* MANAGED WEBSITES LIST / CARDS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                Website Domains Handled ({webDomains.length})
              </span>
              <span className="text-[11px] text-slate-400">Click domain to filter calendar view</span>
            </div>

            {webDomains.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                <Globe className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No website domains added yet.</p>
                <button
                  type="button"
                  onClick={handleOpenAddWebDomain}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                >
                  + Add First Website Domain
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {webDomains.map((dom) => {
                  const totalForMonth = getWebDomainPostCount(dom.id);
                  const postedForMonth = getWebDomainPostedCount(dom.id);
                  const pct = dom.monthlyGoal > 0 ? Math.min(100, Math.round((postedForMonth / dom.monthlyGoal) * 100)) : 0;
                  const isSelected = selectedWebDomainId === dom.id;

                  return (
                    <div
                      key={dom.id}
                      onClick={() => setSelectedWebDomainId(isSelected ? 'all' : dom.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer relative group ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                          : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${dom.color || 'bg-emerald-500'}`} />
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-1">
                              {dom.siteName}
                            </h4>
                            <a
                              href={`https://${dom.url}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-1 underline decoration-slate-300"
                            >
                              <span>{dom.url}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditWebDomain(dom);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                            title="Edit Website Domain"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmWebDomain(dom);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Website Domain"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Goal & Progress */}
                      <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Monthly Goal:</span>
                          <span className="text-slate-800">
                            {postedForMonth} / {dom.monthlyGoal} Articles ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              pct >= 100 ? 'bg-emerald-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Workspace Quick Badges */}
                        <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                          {dom.notes && (
                            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <StickyNote className="w-2.5 h-2.5 text-emerald-600" /> Notes
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ListTodo className="w-2.5 h-2.5 text-indigo-600" />
                            {(dom.tasks || []).filter(t => t.completed).length}/{(dom.tasks || []).length} Tasks
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Target className="w-2.5 h-2.5 text-amber-600" />
                            {(dom.keywords || []).length} Keywords
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Paperclip className="w-2.5 h-2.5 text-emerald-600" />
                            {(dom.attachments || []).length} Files
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* WEBSITE DOMAIN WORKSPACE: NOTEPAD, TASK TO-DO LIST, TARGETING KEYWORDS */}
          {webDomains.length > 0 && (() => {
            const activeDomain = webDomains.find((d) => d.id === selectedWebDomainId) || webDomains[0];
            const tasks = activeDomain.tasks || [];
            const keywords = activeDomain.keywords || [];
            const completedTasks = tasks.filter((t) => t.completed).length;
            const taskPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

            return (
              <div className="bg-gradient-to-b from-slate-50/80 to-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
                {/* Workspace Header & Website Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${activeDomain.color || 'bg-emerald-500'} shrink-0`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                          {activeDomain.siteName}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Domain Workspace
                        </span>
                      </div>
                      <a
                        href={`https://${activeDomain.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-1 underline decoration-slate-300"
                      >
                        <span>https://{activeDomain.url}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  </div>

                  {/* Domain Selector Dropdown */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 shrink-0">Selected Domain:</label>
                    <select
                      value={activeDomain.id}
                      onChange={(e) => setSelectedWebDomainId(e.target.value)}
                      className="bg-white border border-slate-300 hover:border-slate-400 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {webDomains.map((d) => (
                        <option key={d.id} value={d.id}>
                          🌐 {d.siteName} ({d.url})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Workspace Tool Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveDomainWorkspaceTab('notepad')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                      activeDomainWorkspaceTab === 'notepad'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <StickyNote className="w-4 h-4" />
                    <span>📝 Notepad & Strategy</span>
                    {activeDomain.notes && activeDomain.notes.trim().length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDomainWorkspaceTab('tasks')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                      activeDomainWorkspaceTab === 'tasks'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <ListTodo className="w-4 h-4" />
                    <span>✅ Task To-Do List</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeDomainWorkspaceTab === 'tasks' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {completedTasks}/{tasks.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDomainWorkspaceTab('keywords')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                      activeDomainWorkspaceTab === 'keywords'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>🎯 Targeting Keywords</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeDomainWorkspaceTab === 'keywords' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {keywords.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDomainWorkspaceTab('files')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                      activeDomainWorkspaceTab === 'files'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>📁 Upload Photos & PDFs</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeDomainWorkspaceTab === 'files' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {(activeDomain.attachments || []).length}
                    </span>
                  </button>
                </div>

                {/* TAB 1: NOTEPAD */}
                {activeDomainWorkspaceTab === 'notepad' && (
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-extrabold text-slate-800">
                          Domain Notepad for {activeDomain.siteName}
                        </h4>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ⚡ Auto-Saved
                      </span>
                    </div>

                    <textarea
                      rows={5}
                      value={activeDomain.notes || ''}
                      onChange={(e) => handleUpdateDomainNotes(activeDomain.id, e.target.value)}
                      placeholder="Write strategy notes, login references, content ideas, or guidelines for this domain..."
                      className="w-full p-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-slate-800 bg-slate-50/50 leading-relaxed resize-y"
                    />

                    {/* Quick Template Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">Quick Templates:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = activeDomain.notes || '';
                            const tpl = `\n📌 SEO STRATEGY & GOALS:\n- Target 8 articles/month\n- Build high DA backlinks\n- Fix 404 links monthly`;
                            handleUpdateDomainNotes(activeDomain.id, current + tpl);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded text-[10px] font-bold text-slate-600 transition cursor-pointer"
                        >
                          + SEO Strategy Template
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = activeDomain.notes || '';
                            const tpl = `\n📌 ON-PAGE CHECKLIST:\n- H1/H2 Optimization\n- Alt text on images\n- Internal linking to money pages`;
                            handleUpdateDomainNotes(activeDomain.id, current + tpl);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded text-[10px] font-bold text-slate-600 transition cursor-pointer"
                        >
                          + On-Page Checklist
                        </button>
                      </div>

                      {activeDomain.notes && (
                        <button
                          type="button"
                          onClick={() => handleUpdateDomainNotes(activeDomain.id, '')}
                          className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition cursor-pointer"
                        >
                          Clear Notes
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: TASK TO-DO LIST */}
                {activeDomainWorkspaceTab === 'tasks' && (
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-extrabold text-slate-800">
                          Task To-Do List ({completedTasks}/{tasks.length} Done)
                        </h4>
                      </div>
                      
                      {/* Task Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${taskPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-700">{taskPct}% Completed</span>
                      </div>
                    </div>

                    {/* Add Task Input Form */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Add new task (e.g., Fix 404 links, Submit Webmaster report)..."
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTaskToDomain(activeDomain.id);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="px-2 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-md text-slate-700 cursor-pointer"
                      >
                        <option value="High">🔴 High Priority</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🔵 Low Priority</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddTaskToDomain(activeDomain.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>

                    {/* Task Items List */}
                    {tasks.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs font-medium">
                        No tasks added yet for this domain. Add a task above!
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition ${
                              task.completed
                                ? 'bg-emerald-50/50 border-emerald-200 text-slate-500'
                                : 'bg-slate-50/70 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleDomainTask(activeDomain.id, task.id)}
                                className={`w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition shrink-0 ${
                                  task.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-slate-300 hover:border-emerald-500'
                                }`}
                              >
                                {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <span className={`text-xs font-semibold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {task.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                task.priority === 'High'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'Medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {task.priority || 'Medium'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteDomainTask(activeDomain.id, task.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ASSIGNED TEAM TASKS FOR THIS DOMAIN / WORKSPACE */}
                    {assignedTasks && assignedTasks.length > 0 && (
                      <div className="pt-3 border-t border-slate-200 space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Studio Tasks Assigned to {activeMemberName || 'You'} ({assignedTasks.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {assignedTasks.map((t) => (
                            <div key={t.id} className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-slate-900">{t.title}</span>
                                  {t.domainName && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white text-indigo-700 border border-indigo-200">
                                      {t.domainName}
                                    </span>
                                  )}
                                </div>
                                {t.notes && <p className="text-[11px] text-slate-600 italic">"{t.notes}"</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={t.status}
                                  onChange={(e) => onUpdateTask?.({ ...t, status: e.target.value as any })}
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-bold text-slate-800 shadow-2xs cursor-pointer"
                                >
                                  <option value="not_started">Not Started</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="completed">✓ Completed</option>
                                </select>

                                {onEditTask && (
                                  <button
                                    type="button"
                                    onClick={() => onEditTask(t)}
                                    className="p-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition cursor-pointer flex items-center gap-1 font-bold text-[10px]"
                                    title="Edit Task Details"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                )}

                                {onDeleteTask && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete task "${t.title}"?`)) {
                                        onDeleteTask(t.id);
                                      }
                                    }}
                                    className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 transition cursor-pointer flex items-center gap-1 font-bold text-[10px]"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: TARGETING KEYWORDS */}
                {activeDomainWorkspaceTab === 'keywords' && (
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-extrabold text-slate-800">
                          Targeting Keywords Tracker ({keywords.length} Keywords)
                        </h4>
                      </div>
                    </div>

                    {/* Add Keyword Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Keyword (e.g. Udaipur Photographer)"
                        value={newKwName}
                        onChange={(e) => setNewKwName(e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-md focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Target URL (e.g. /udaipur-guide)"
                        value={newKwTargetUrl}
                        onChange={(e) => setNewKwTargetUrl(e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-md focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Search Volume (e.g. 12.5K/mo)"
                        value={newKwSearchVol}
                        onChange={(e) => setNewKwSearchVol(e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-md focus:border-emerald-500"
                      />
                      <select
                        value={newKwStatus}
                        onChange={(e) => setNewKwStatus(e.target.value as any)}
                        className="px-2 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-md text-slate-700 cursor-pointer"
                      >
                        <option value="Targeted">🎯 Targeted</option>
                        <option value="Ranking In Top 10">📈 Top 10</option>
                        <option value="Top 3">🏆 Top 3</option>
                        <option value="Planned">🗓️ Planned</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddKeywordToDomain(activeDomain.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Keyword</span>
                      </button>
                    </div>

                    {/* Keywords List / Table */}
                    {keywords.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs font-medium">
                        No keywords added for this domain yet. Add your first target keyword above!
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Target Keyword</th>
                              <th className="p-2.5">Target URL</th>
                              <th className="p-2.5">Search Volume</th>
                              <th className="p-2.5">Ranking Status</th>
                              <th className="p-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {keywords.map((kw) => (
                              <tr key={kw.id} className="hover:bg-slate-50 transition">
                                <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                                  <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>{kw.keyword}</span>
                                </td>
                                <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                                  {kw.targetUrl || '-'}
                                </td>
                                <td className="p-2.5 font-bold text-slate-700">
                                  {kw.searchVolume || '-'}
                                </td>
                                <td className="p-2.5">
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                                    kw.status === 'Top 3'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : kw.status === 'Ranking In Top 10'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {kw.status}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDomainKeyword(activeDomain.id, kw.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                    title="Delete keyword"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PHOTOS & PDF FILES UPLOAD */}
                {activeDomainWorkspaceTab === 'files' && (() => {
                  const domainFiles = activeDomain.attachments || [];
                  return (
                    <div className="space-y-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <FolderPlus className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-xs font-extrabold text-slate-800">
                            Domain Photos, PDFs & Documents ({domainFiles.length} Uploaded)
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Supports JPG, PNG, WEBP, PDF, DOC, TXT (Up to 10MB)
                        </span>
                      </div>

                      {/* Upload Drop Zone / Button */}
                      <div className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50 rounded-xl p-4 text-center transition group relative">
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            Array.from(files).forEach((file: File) => {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const url = event.target?.result as string;
                                const newAtt: WebContentAttachment = {
                                  id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                  name: file.name,
                                  url: url,
                                  type: file.type || 'application/octet-stream',
                                  size: file.size
                                };
                                handleAddDomainAttachment(activeDomain.id, newAtt);
                              };
                              reader.readAsDataURL(file);
                            });
                            e.target.value = '';
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800">
                              Click or Drag & Drop Photos and PDFs here
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              Upload photos, infographics, client briefs, or SEO PDF reports for {activeDomain.siteName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Uploaded Files Grid */}
                      {domainFiles.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-lg border border-slate-100">
                          No photos or PDF files uploaded for this domain yet. Drag & drop files above to upload!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {domainFiles.map((att) => {
                            const isImage = att.type?.startsWith('image/');
                            const isPdf = att.type?.includes('pdf') || att.name.endsWith('.pdf');
                            const sizeKB = typeof att.size === 'number' ? `${(att.size / 1024).toFixed(1)} KB` : (att.size || '');

                            return (
                              <div
                                key={att.id}
                                className="group flex flex-col justify-between bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-3 shadow-2xs transition hover:shadow-xs relative"
                              >
                                <div>
                                  {/* File Preview */}
                                  {isImage && att.url ? (
                                    <div className="w-full h-28 bg-slate-200 rounded-lg overflow-hidden mb-2 relative">
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                      />
                                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                                        🖼️ Photo
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="w-full h-20 bg-emerald-50/80 border border-emerald-100 rounded-lg flex items-center justify-center mb-2 gap-2">
                                      <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
                                      <div>
                                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                                          {isPdf ? '📄 PDF Document' : '📝 File'}
                                        </span>
                                        {sizeKB && <p className="text-[10px] text-slate-500 font-bold mt-1">{sizeKB}</p>}
                                      </div>
                                    </div>
                                  )}

                                  {/* File Title & Info */}
                                  <h5 className="text-xs font-extrabold text-slate-900 line-clamp-1" title={att.name}>
                                    {att.name}
                                  </h5>
                                  {isImage && sizeKB && (
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sizeKB}</p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/80">
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 px-2 py-1 rounded-md text-[11px] font-bold transition shadow-2xs"
                                  >
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                    <span>View / Open</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDomainAttachment(activeDomain.id, att.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                                    title="Delete File"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* WEBSITE MONTHLY CALENDAR TOOLBAR */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {/* Month Navigator */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-extrabold text-slate-900 min-w-[130px] text-center">
                  {monthName} {year}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Filters & View Switcher */}
              <div className="flex items-center flex-wrap gap-2">
                {/* Search Input Box */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search web articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-6 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36 sm:w-44 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Website Filter Dropdown */}
                <select
                  value={selectedWebDomainId}
                  onChange={(e) => setSelectedWebDomainId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="all">🌐 All Websites ({webDomains.length})</option>
                  {webDomains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.siteName}
                    </option>
                  ))}
                </select>

                {/* Content Type Filter */}
                <select
                  value={selectedWebContentTypeFilter}
                  onChange={(e) => setSelectedWebContentTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="all">📝 All Content Types</option>
                  <option value="Off page">Off page</option>
                  <option value="On page">On page</option>
                  <option value="Monthly report">Monthly report</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedWebStatusFilter}
                  onChange={(e) => setSelectedWebStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="all">⚡ All Statuses</option>
                  <option value="Pending">⏳ Pending</option>
                  <option value="Posted">✓ Published</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('calendar')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      viewMode === 'calendar' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Planner List
                  </button>
                </div>
              </div>
            </div>

            {/* CALENDAR GRID VIEW - WEBSITE */}
            {viewMode === 'calendar' ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-slate-100/80 border-b border-slate-200 text-center py-2 text-xs font-black text-slate-600 uppercase tracking-wider">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/30">
                  {/* Blank leading days */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`blank-${i}`} className="min-h-[120px] bg-slate-50/50 p-1.5" />
                  ))}

                  {/* Days of month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayPosts = filteredWebPosts.filter((p) => p.date === dateStr);
                    const isToday =
                      new Date().getDate() === dayNum &&
                      new Date().getMonth() === month &&
                      new Date().getFullYear() === year;

                    return (
                      <div
                        key={dateStr}
                        className={`min-h-[120px] p-2 transition flex flex-col justify-between group ${
                          isToday ? 'bg-emerald-50/40 border border-emerald-300' : 'hover:bg-slate-50/90'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                                isToday ? 'bg-emerald-600 text-white' : 'text-slate-700'
                              }`}
                            >
                              {dayNum}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenAddWebPost(dateStr)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                              title="Add article on this date"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Posts list inside cell */}
                          <div className="space-y-1.5">
                            {dayPosts.map((post) => {
                              const dom = webDomains.find((d) => d.id === post.websiteId);
                              const isPosted = post.status === 'Posted';

                              return (
                                <div
                                  key={post.id}
                                  onClick={() => handleOpenEditWebPost(post)}
                                  className={`p-2 rounded-xl text-xs font-medium border shadow-2xs transition cursor-pointer hover:scale-[1.01] ${
                                    isPosted
                                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                                      : 'bg-white border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 truncate max-w-[100px]">
                                      {dom?.siteName || 'Website'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleWebPostStatus(post.id);
                                      }}
                                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer ${
                                        isPosted
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                                      }`}
                                    >
                                      {isPosted ? '✓ Live' : '⏳ Draft'}
                                    </button>
                                  </div>

                                  <p className="font-extrabold text-xs text-slate-900 line-clamp-2 leading-snug">
                                    {post.title}
                                  </p>

                                  {/* Attached Files Badge in Calendar Grid */}
                                  {post.attachments && post.attachments.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit">
                                      <Paperclip className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                      <span>{post.attachments.length} File{post.attachments.length > 1 ? 's' : ''} Attached</span>
                                    </div>
                                  )}

                                  {post.focusKeywords && (
                                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                      🔑 {post.focusKeywords}
                                    </p>
                                  )}


                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {dayPosts.length === 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddWebPost(dateStr)}
                            className="text-[10px] text-slate-400 hover:text-emerald-600 font-bold py-1 w-full text-center hover:bg-emerald-50/50 rounded transition mt-2"
                          >
                            + Add Web Article
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* PLANNER LIST VIEW - WEBSITE */
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                {filteredWebPosts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <Globe className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold">No web content found for this month or selection.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddWebPost()}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      + Schedule a web post now
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredWebPosts
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((post) => {
                        const dom = webDomains.find((d) => d.id === post.websiteId);

                        return (
                          <div
                            key={post.id}
                            className="p-3.5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-center bg-slate-100 p-2 rounded-xl border border-slate-200 shrink-0 min-w-[50px]">
                                <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                                  {new Date(post.date).toLocaleString('default', { month: 'short' })}
                                </span>
                                <span className="text-base font-black text-slate-900 block leading-tight">
                                  {new Date(post.date).getDate()}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    🌐 {dom?.siteName || 'Website'}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {post.contentType}
                                  </span>
                                  {post.subCategory && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      ⚡ {post.subCategory}
                                    </span>
                                  )}
                                  {getStatusBadge(post.status, () => handleToggleWebPostStatus(post.id))}
                                </div>

                                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                                  {post.title}
                                </h4>

                                {post.focusKeywords && (
                                  <p className="text-xs text-slate-500 font-medium">
                                    🔑 Target Keywords: <strong className="text-slate-700">{post.focusKeywords}</strong>
                                  </p>
                                )}

                                {post.metaDescription && (
                                  <p className="text-xs text-slate-500 italic line-clamp-1">
                                    "{post.metaDescription}"
                                  </p>
                                )}

                                {/* Attached Files List Display */}
                                {post.attachments && post.attachments.length > 0 && (
                                  <div className="pt-2 mt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1 shrink-0">
                                      <Paperclip className="w-3 h-3 text-emerald-600" />
                                      Files ({post.attachments.length}):
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {post.attachments.map((att) => (
                                        <a
                                          key={att.id}
                                          href={att.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded px-2 py-0.5 text-[10px] text-slate-700 hover:text-emerald-700 font-bold transition shadow-2xs"
                                          title={`Click to view/download ${att.name}`}
                                        >
                                          {att.type?.startsWith('image/') && att.url ? (
                                            <img src={att.url} alt={att.name} className="w-3.5 h-3.5 object-cover rounded" />
                                          ) : (
                                            <FileText className="w-3 h-3 text-slate-500" />
                                          )}
                                          <span className="max-w-[130px] truncate">{att.name}</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}


                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleWebPostStatus(post.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                              >
                                Advance Status
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditWebPost(post)}
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
                                title="Edit Web Post"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmWebPost(post)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition cursor-pointer"
                                title="Delete Web Post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-pink-600" />
                {editingAccount ? 'Edit Social Account' : 'Add New Social Media Account'}
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan & Ananya Wedding"
                  value={accClientName}
                  onChange={(e) => setAccClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={accPlatform}
                    onChange={(e) => setAccPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="All">All Platforms</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Pinterest">Pinterest</option>
                    <option value="X">X (Twitter)</option>
                    <option value="GMB">GMB (Google Business)</option>
                    <option value="Tumblr">Tumblr</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Threads">Threads</option>
                    <option value="Snapchat">Snapchat</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Reddit">Reddit</option>
                    <option value="Medium">Medium</option>
                    <option value="Website">Website / Blog</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Handle / Username
                  </label>
                  <input
                    type="text"
                    placeholder="@wedding_films"
                    value={accHandle}
                    onChange={(e) => setAccHandle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Style Guidelines
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on romantic aesthetic, 9:16 vertical 4K reels"
                  value={accNotes}
                  onChange={(e) => setAccNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT POST */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                {editingPost ? 'Edit Scheduled Post' : 'Schedule New Social Media Post'}
              </h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Schedule Type / Frequency
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  {(['Daily', 'Weekly', 'Monthly', 'Custom Date'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setPostFrequency(freq)}
                      className={`py-1.5 px-1 text-[11px] font-bold rounded-md transition cursor-pointer text-center ${
                        postFrequency === freq
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      {freq === 'Daily' && '🔄 Daily'}
                      {freq === 'Weekly' && '🗓️ Weekly'}
                      {freq === 'Monthly' && '📅 Monthly'}
                      {freq === 'Custom Date' && '📆 Custom'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {postFrequency === 'Custom Date' ? 'Date *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Post Type
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Reel">Reel</option>
                    <option value="Story">Story</option>
                    <option value="Carousel">Carousel</option>
                    <option value="Static Post">Static Post</option>
                    <option value="YouTube Short">YouTube Short</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Post Concept / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sangeet Bride Entry Reel with Punjabi Dhol Beats"
                  value={postConcept}
                  onChange={(e) => setPostConcept(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Caption & Hashtags
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter Instagram caption & hashtags..."
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Multi-Platform Published Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Published Platforms
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = POPULAR_POST_PLATFORMS.map((p) => p.id);
                        setPostPostedPlatforms(allIds);
                        setPostStatus('Posted');
                      }}
                      className="text-[10px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPostPostedPlatforms([]);
                        setPostStatus('Pending');
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {POPULAR_POST_PLATFORMS.map((plat) => {
                    const isSelected = postPostedPlatforms.includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            const updated = postPostedPlatforms.filter((p) => p !== plat.id);
                            setPostPostedPlatforms(updated);
                            if (updated.length === 0) setPostStatus('Pending');
                          } else {
                            const updated = [...postPostedPlatforms, plat.id];
                            setPostPostedPlatforms(updated);
                            setPostStatus('Posted');
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{plat.icon}</span>
                        <span>{plat.label}</span>
                        {isSelected && <span className="text-white font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Post Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPostStatus('Pending')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      postStatus !== 'Posted'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⏳ Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostStatus('Posted')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      postStatus === 'Posted'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ Posted
                  </button>
                </div>
              </div>



              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingPost ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmPost(editingPost)}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Delete Post
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                  >
                    Save Scheduled Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE ACCOUNT CONFIRMATION */}
      {deleteConfirmAcc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100 border border-red-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Delete Social Account</h3>
                <p className="text-[11px] text-slate-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
              Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmAcc.clientName}</strong> ({deleteConfirmAcc.handle})? All scheduled posts associated with this account will also be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmAcc(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteAccount(deleteConfirmAcc.id);
                  setDeleteConfirmAcc(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                OK, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE POST CONFIRMATION */}
      {deleteConfirmPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100 border border-red-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Delete Scheduled Post</h3>
                <p className="text-[11px] text-slate-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
              Are you sure you want to delete <strong className="text-slate-900">"{deleteConfirmPost.concept}"</strong> scheduled for <strong className="text-slate-900">{deleteConfirmPost.date}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmPost(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeletePost(deleteConfirmPost.id);
                  setDeleteConfirmPost(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                OK, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT WEBSITE DOMAIN */}
      {isWebDomainModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                {editingWebDomain ? 'Edit Website Domain' : 'Add New Website Domain'}
              </h3>
              <button
                type="button"
                onClick={() => setIsWebDomainModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWebDomain} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Weddings Blog"
                  value={webSiteName}
                  onChange={(e) => setWebSiteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website Domain URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. yourdomain.com"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Article Goal
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={webMonthlyGoal}
                  onChange={(e) => setWebMonthlyGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Focus Keywords Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on Luxury Wedding Photography, SEO Blogs, Client Stories"
                  value={webNotes}
                  onChange={(e) => setWebNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWebDomainModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: SCHEDULE / EDIT WEBSITE POST */}
      {isWebPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                {editingWebPost ? 'Edit Scheduled Web Post' : 'Schedule New Website Article'}
              </h3>
              <button
                type="button"
                onClick={() => setIsWebPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWebPost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Website Domain *
                </label>
                <select
                  required
                  value={webPostWebsiteId}
                  onChange={(e) => setWebPostWebsiteId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">Select Domain...</option>
                  {webDomains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.siteName} ({d.url})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Type *
                  </label>
                  <select
                    value={webPostContentType}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setWebPostContentType(newType);
                      // Reset sub category to first option of new category
                      const defaults = WEB_SUB_CATEGORIES[newType];
                      if (defaults && defaults.length > 0) {
                        setWebPostSubCategory(defaults[0]);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Off page">Off page</option>
                    <option value="On page">On page</option>
                    <option value="Monthly report">Monthly report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publishing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={webPostDate}
                    onChange={(e) => setWebPostDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Sub Category Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sub Category / Activity ({webPostContentType}) *
                </label>
                <select
                  value={webPostSubCategory}
                  onChange={(e) => setWebPostSubCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-emerald-50/50 border-emerald-200"
                >
                  <option value="">-- Select Sub Category --</option>
                  {(WEB_SUB_CATEGORIES[webPostContentType] || []).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Task Details / Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Task Details / Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${webPostSubCategory || 'Task details...'}`}
                  value={webPostTitle}
                  onChange={(e) => setWebPostTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    Attach Files / Work Proofs (Optional)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Images, PDFs, Docs, Screenshots</span>
                </label>
                
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/30 rounded-xl p-3 text-center transition cursor-pointer relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      Array.from(files).forEach((file: File) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const url = event.target?.result as string;
                          const sizeStr = file.size > 1024 * 1024 
                            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                            : `${Math.round(file.size / 1024)} KB`;
                          setWebPostAttachments((prev) => [
                            ...prev,
                            {
                              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                              name: file.name,
                              url,
                              size: sizeStr,
                              type: file.type
                            }
                          ]);
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    <div className="p-2 bg-white rounded-full border border-slate-200 text-emerald-600 shadow-2xs group-hover:scale-110 transition">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      Click or Drag & Drop files here
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports Images, PDFs, Word, Excel, Screenshots
                    </p>
                  </div>
                </div>

                {/* Attached Files List */}
                {webPostAttachments.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <p className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1">
                      Attached Files ({webPostAttachments.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {webPostAttachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 pr-2 text-xs shadow-2xs group"
                        >
                          {file.type?.startsWith('image/') && file.url ? (
                            <img src={file.url} alt={file.name} className="w-7 h-7 object-cover rounded" />
                          ) : (
                            <div className="p-1 bg-slate-100 rounded text-slate-600">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="max-w-[130px] truncate">
                            <p className="text-[11px] font-bold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            {file.size && <p className="text-[9px] text-slate-400">{file.size}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => setWebPostAttachments((prev) => prev.filter((f) => f.id !== file.id))}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition ml-auto"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>



              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingWebPost ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmWebPost(editingWebPost);
                      setIsWebPostModalOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Delete Post
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWebPostModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                  >
                    Save Article
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: CONFIRM DELETE WEBSITE DOMAIN */}
      {deleteConfirmWebDomain && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Delete Website Domain?</h3>
                <p className="text-xs text-slate-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
              Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmWebDomain.siteName}</strong> ({deleteConfirmWebDomain.url})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmWebDomain(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteWebDomain(deleteConfirmWebDomain.id);
                  setDeleteConfirmWebDomain(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                OK, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: CONFIRM DELETE WEBSITE POST */}
      {deleteConfirmWebPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Delete Article Schedule?</h3>
                <p className="text-xs text-slate-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
              Are you sure you want to delete <strong className="text-slate-900">"{deleteConfirmWebPost.title}"</strong> scheduled for <strong className="text-slate-900">{deleteConfirmWebPost.date}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmWebPost(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteWebPost(deleteConfirmWebPost.id);
                  setDeleteConfirmWebPost(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                OK, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
