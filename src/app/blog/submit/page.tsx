'use client';

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';

interface Cohort {
  id: string;
  name: string;
}

export default function SubmitBlogPage() {
  const { isAuthenticated, profile, loading: authLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfileData, setUserProfileData] = useState<{
    name: string;
    email: string;
    cohort: string;
    cohortId: string;
    bio: string;
  } | null>(null);
  const [studentPosts, setStudentPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Fetch student blog posts (always fetch, even when not authenticated)
  useEffect(() => {
    const fetchStudentPosts = async () => {
      try {
        setLoadingPosts(true);
        const res = await fetch('/api/blog?limit=6');
        if (res.ok) {
          const data = await res.json();
          // Filter to show only posts from students (academy students)
          const posts = (data.posts || []).filter((post: any) => 
            post.isAcademyStudent || post.isGraduate
          );
          setStudentPosts(posts.slice(0, 6)); // Show up to 6 recent posts
        }
      } catch (error) {
        console.error('Error fetching student posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };
    
    fetchStudentPosts();
  }, []);

  // Fetch user profile data when authenticated
  useEffect(() => {
    if (isAuthenticated && profile && !authLoading) {
      // Close login modal if open
      setShowLoginModal(false);
      
      // Fetch user's full profile data including cohort
      const fetchUserData = async () => {
        try {
          const res = await fetch('/api/profile/user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: profile.email }),
          });
          
          if (res.ok) {
            const data = await res.json();
            setUserProfileData({
              name: profile.name || "",
              email: profile.email || "",
              cohort: data.cohort?.name || "",
              cohortId: data.profile?.cohort_id || "",
              bio: data.profile?.bio || "",
            });
          } else {
            // Fallback to basic profile data
            setUserProfileData({
              name: profile.name || "",
              email: profile.email || "",
              cohort: "",
              cohortId: "",
              bio: "",
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic profile data
          setUserProfileData({
            name: profile.name || "",
            email: profile.email || "",
            cohort: "",
            cohortId: "",
            bio: "",
          });
        }
      };
      
      fetchUserData();
    } else if (!isAuthenticated && !authLoading) {
      // Show login modal if not authenticated
      setShowLoginModal(true);
      setUserProfileData(null);
    }
  }, [isAuthenticated, profile, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure user is authenticated and has profile data
    if (!isAuthenticated || !userProfileData) {
      setShowLoginModal(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/blog/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorName: userProfileData.name,
          authorEmail: userProfileData.email,
          cohort: userProfileData.cohort,
          cohortId: userProfileData.cohortId || null,
          authorBio: userProfileData.bio,
          title: formData.title,
          category: formData.category,
          content: formData.content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit blog post');
      }

      // Show success message
      alert(data.message || "Thank you for your submission! We'll review it and get back to you within 5-7 business days.");
      
      // Reset form (keep user data)
      setFormData({
        title: "",
        category: "",
        content: "",
      });
    } catch (error: any) {
      console.error('Error submitting blog post:', error);
      alert(error.message || 'Failed to submit blog post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        <div className="relative z-10 w-full bg-black/95">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center text-zinc-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show message if not authenticated (login modal will be shown)
  if (!isAuthenticated) {
    return (
      <>
        <div className="relative min-h-screen w-full overflow-x-hidden">
          <div className="relative z-10 w-full bg-black/95">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
              <div className="mb-12">
                <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-8 text-center">
                  <h1 className="text-3xl font-bold text-yellow-200 mb-4">
                    Sign In Required
                  </h1>
                  <p className="text-lg text-zinc-300 mb-6">
                    You must be signed in to submit a blog post. This ensures that we can properly track submissions and award sats rewards when your blog is approved.
                  </p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Student Blog Posts */}
              <div className="mt-12">
                <h2 className="text-2xl font-semibold text-zinc-50 mb-6 text-center sm:text-left">
                  Recent Posts from Students
                </h2>
                
                {loadingPosts ? (
                  <div className="text-center py-8 text-zinc-400">Loading posts...</div>
                ) : studentPosts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    No student posts yet. Be the first to submit!
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {studentPosts.map((post) => (
                      <a
                        key={post.id}
                        href={`/blog/${post.slug || post.id}`}
                        className="group relative flex flex-col rounded-xl border border-cyan-400/25 bg-black/80 p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                      >
                        {post.isAcademyStudent && (
                          <div className="absolute -top-2 -right-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300">
                            🎓 Academy Student
                          </div>
                        )}
                        {post.isGraduate && !post.isAcademyStudent && (
                          <div className="absolute -top-2 -right-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300">
                            🎓 Graduate
                          </div>
                        )}
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-2xl">{post.image || '📝'}</span>
                          <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-300">
                            {post.category || 'Blog'}
                          </span>
                        </div>
                        <h3 className="mb-3 text-lg font-semibold text-zinc-50 group-hover:text-cyan-200 transition line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-400 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="mt-auto space-y-2 border-t border-cyan-400/10 pt-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/20">
                              <span className="text-xs">👤</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-300 truncate">{post.author}</p>
                              <p className="text-[10px] text-zinc-500 truncate">
                                {post.country ? `${post.country} • ` : ''}{post.authorRole || 'Student'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>{post.date}</span>
                            <div className="flex items-center gap-2">
                              <span>{post.readTime}</span>
                              {post.sats && post.sats !== '0' && (
                                <span className="flex items-center gap-1 rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-300">
                                  ⚡ {post.sats}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                
                {studentPosts.length > 0 && (
                  <div className="mt-8 text-center">
                    <a
                      href="/blog"
                      className="inline-block rounded-lg border border-cyan-400/50 bg-transparent px-6 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                    >
                      View All Blog Posts →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <AuthModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          mode="signin"
          redirectAfterLogin={null}
        />
      </>
    );
  }

  // Wait for profile data to load
  if (!userProfileData) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden">
        <div className="relative z-10 w-full bg-black/95">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center text-zinc-400">Loading your profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="relative z-10 w-full bg-black/95">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Submit Your Blog Post
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
              Share your Bitcoin story, ideas, and insights with the community.
            </p>
          </div>

          {/* Submission Form */}
          <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            {/* Author Info Display (Read-only from profile) */}
            <div className="mb-6 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
              <h3 className="text-sm font-semibold text-cyan-200 mb-3">Author Information</h3>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-zinc-400">Name:</span>{' '}
                  <span className="text-zinc-200">{userProfileData.name}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Email:</span>{' '}
                  <span className="text-zinc-200">{userProfileData.email}</span>
                </div>
                {userProfileData.cohort && (
                  <div>
                    <span className="text-zinc-400">Cohort:</span>{' '}
                    <span className="text-zinc-200">{userProfileData.cohort}</span>
                  </div>
                )}
                {userProfileData.bio && (
                  <div>
                    <span className="text-zinc-400">Bio:</span>{' '}
                    <span className="text-zinc-200">{userProfileData.bio}</span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                This information is from your profile. To update it, visit your profile settings.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Blog Post Information */}
              <div className="space-y-4 border-t border-cyan-400/10 pt-6">
                <h2 className="text-xl font-semibold text-cyan-200">Blog Post Details</h2>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    placeholder="Your blog post title"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-zinc-950 text-zinc-400">Select a category</option>
                    <option value="pre-education" className="bg-zinc-950 text-zinc-50">💡 Pre-Education Ideas (Before Learning)</option>
                    <option value="essays" className="bg-zinc-950 text-zinc-50">✍️ Student Essays</option>
                    <option value="community" className="bg-zinc-950 text-zinc-50">🤝 Community Stories</option>
                    <option value="africa" className="bg-zinc-950 text-zinc-50">🌍 Bitcoin in Africa</option>
                    <option value="technical" className="bg-zinc-950 text-zinc-50">💻 Technical Deep Dives</option>
                    <option value="lightning" className="bg-zinc-950 text-zinc-50">⚡ Lightning Experiments</option>
                    <option value="future" className="bg-zinc-950 text-zinc-50">🔮 Ideas for the Future</option>
                    <option value="beginner" className="bg-zinc-950 text-zinc-50">📖 Beginner Lessons</option>
                    <option value="reflections" className="bg-zinc-950 text-zinc-50">💭 Reflections & Opinions</option>
                    <option value="builders" className="bg-zinc-950 text-zinc-50">🛠️ Builder Showcases</option>
                    <option value="projects" className="bg-zinc-950 text-zinc-50">🎓 Graduation Projects</option>
                    <option value="Use Cases" className="bg-zinc-950 text-zinc-50">Use Cases</option>
                    <option value="Development" className="bg-zinc-950 text-zinc-50">Development</option>
                    <option value="Community" className="bg-zinc-950 text-zinc-50">Community</option>
                    <option value="Technology" className="bg-zinc-950 text-zinc-50">Technology</option>
                    <option value="Education" className="bg-zinc-950 text-zinc-50">Education</option>
                    <option value="Other" className="bg-zinc-950 text-zinc-50">Other</option>
                  </select>
                  {formData.category === "pre-education" && (
                    <p className="mt-2 text-xs text-purple-300">
                      💡 Share your thoughts, questions, or ideas about Bitcoin before you start learning. This helps us understand what people think before education! (Minimum 300 words)
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Content <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    className="w-full rounded-lg border border-cyan-400/20 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 font-mono"
                    placeholder={formData.category === "pre-education" ? "Share your thoughts, questions, or ideas about Bitcoin. What do you think Bitcoin is? What questions do you have? What interests you? (minimum 300 words, maximum 2000 words)..." : "Write your blog post here (minimum 500 words, maximum 2000 words)..."}
                  />
                  <p className="mt-2 text-xs text-zinc-400">
                    Word count: {formData.content.split(/\s+/).filter(Boolean).length} words
                    {formData.category === "pre-education" && " (minimum 300 words for pre-education posts)"}
                    {formData.category !== "pre-education" && " (minimum 500 words)"}
                  </p>
                </div>
              </div>

              {/* Guidelines Reminder */}
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-xs text-zinc-400">
                  <span className="font-semibold text-orange-300">Remember:</span> Your content should be original, educational, and respectful. 
                  We'll review your submission and get back to you within 5-7 business days.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-400 via-orange-400 to-purple-500 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_40px_rgba(34,211,238,0.4)] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Blog Post"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

