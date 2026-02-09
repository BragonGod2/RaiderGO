
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  CreditCard,
  BarChart3,
  DollarSign,
  Eye,
  UserX,
  ShoppingCart
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useSubscriptionManagement } from '@/hooks/useSubscriptionManagement';
import { useUserManagement } from '@/hooks/useUserManagement';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import SubscriptionPlanForm from '@/components/admin/SubscriptionPlanForm';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import UserEditModal from '@/components/admin/UserEditModal';

const AdminCenter = () => {
  // Protect Route
  useAdminRoute();

  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    fetchSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
  } = useSubscriptionManagement();
  const { deleteUser, fetchUsersWithDetails } = useUserManagement();
  const { fetchAllPurchases } = usePurchaseHistory();

  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = () => {
    if (activeTab === 'courses') fetchCourses();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'subscriptions') fetchPlans();
    if (activeTab === 'purchases') fetchPurchases();
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch courses with purchase counts
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each course, count purchases
      const coursesWithStats = await Promise.all(
        (data || []).map(async (course) => {
          const { count } = await supabase
            .from('purchases')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('payment_status', 'completed');

          const { data: purchases } = await supabase
            .from('purchases')
            .select('amount')
            .eq('course_id', course.id)
            .eq('payment_status', 'completed');

          const revenue = purchases?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

          return {
            ...course,
            purchaseCount: count || 0,
            revenue,
          };
        })
      );

      setCourses(coursesWithStats);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch courses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersData = await fetchUsersWithDetails();
      setUsers(usersData);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const plans = await fetchSubscriptionPlans();
      setSubscriptionPlans(plans);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch subscription plans", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const purchasesData = await fetchAllPurchases();
      setPurchases(purchasesData);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch purchase history", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    try {
      console.log('🗑️ Starting deletion process for course:', id);

      // Call the database function to delete the course and related records
      // This bypasses RLS because it runs with SECURITY DEFINER
      const { data, error } = await supabase.rpc('delete_course_with_relations', {
        course_id_param: id
      });

      console.log('Database function result:', data, 'Error:', error);

      if (error) {
        console.error('❌ Delete course error:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ Database function returned false - deletion failed');
        throw new Error('Course deletion failed');
      }

      console.log('✅ Course deletion successful!');
      toast({ title: "Success", description: "Course deleted successfully" });

      // Wait a bit for database to update, then refetch
      setTimeout(() => {
        fetchCourses();
        setDeleteConfirm(null);
      }, 500);

    } catch (error) {
      console.error('❌ Failed to delete course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase
        .from('roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: "Success", description: `User role updated to ${newRole}` });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId) => {
    const result = await deleteUser(userId);
    if (result.success) {
      toast({ title: "Success", description: "User deleted successfully" });
      fetchUsers();
      setDeleteUserConfirm(null);
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete user", variant: "destructive" });
    }
  };

  const handleCreatePlan = async (planData) => {
    const result = await createSubscriptionPlan(planData);
    if (result.success) {
      toast({ title: "Success", description: "Subscription plan created successfully" });
      setShowPlanForm(false);
      fetchPlans();
    } else {
      toast({ title: "Error", description: result.error || "Failed to create plan", variant: "destructive" });
    }
  };

  const handleUpdatePlan = async (planData) => {
    const result = await updateSubscriptionPlan(editingPlan.id, planData);
    if (result.success) {
      toast({ title: "Success", description: "Subscription plan updated successfully" });
      setEditingPlan(null);
      fetchPlans();
    } else {
      toast({ title: "Error", description: result.error || "Failed to update plan", variant: "destructive" });
    }
  };

  const handleDeletePlan = async (id) => {
    const result = await deleteSubscriptionPlan(id);
    if (result.success) {
      toast({ title: "Success", description: "Subscription plan deleted successfully" });
      fetchPlans();
      setDeleteConfirm(null);
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete plan", variant: "destructive" });
    }
  };

  // Filter courses based on search and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.instructor && course.instructor.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Helmet>
        <title>Admin Center - RaiderGO</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        <main className="pt-32 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">

              {/* Hero */}
              <div className="mb-12 fade-in">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-4">
                  <Shield className="w-12 h-12 text-primary" />
                  Admin Center
                </h1>
                <p className="text-text-secondary text-lg">
                  Manage courses, subscriptions, analytics, and users
                </p>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-1">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-3 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'analytics'
                    ? 'bg-primary/20 text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`px-6 py-3 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'courses'
                    ? 'bg-primary/20 text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Courses
                </button>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`px-6 py-3 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'subscriptions'
                    ? 'bg-primary/20 text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Subscriptions
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-6 py-3 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'users'
                    ? 'bg-primary/20 text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className={`px-6 py-3 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'purchases'
                    ? 'bg-primary/20 text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Purchase History
                </button>
              </div>

              {/* Content Area */}
              <div className="bg-bg-secondary/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 min-h-[500px]">

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && <AnalyticsDashboard />}

                {/* COURSES TAB */}
                {activeTab === 'courses' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white">All Courses ({filteredCourses.length})</h2>
                      <Button
                        onClick={() => navigate('/courses/new?edit=true')}
                        className="bg-primary hover:bg-opacity-90 text-white btn-glow"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Create New Course
                      </Button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="text"
                          placeholder="Search courses by title or instructor..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-bg-tertiary border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                      </div>

                    </div>

                    {loading ? (
                      <div className="text-center py-12 text-text-secondary">Loading courses...</div>
                    ) : filteredCourses.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                        {searchQuery || categoryFilter !== 'all' ? (
                          <>
                            <p className="text-text-secondary mb-2">No courses match your filters.</p>
                            <button
                              onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
                              className="text-primary hover:underline text-sm"
                            >
                              Clear filters
                            </button>
                          </>
                        ) : (
                          <p className="text-text-secondary mb-4">No courses yet. Create your first course!</p>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/10 text-text-secondary text-sm">
                              <th className="pb-4 pl-4">Title</th>
                              <th className="pb-4">Category</th>
                              <th className="pb-4">Price</th>
                              <th className="pb-4">Purchases</th>
                              <th className="pb-4">Revenue</th>
                              <th className="pb-4 text-right pr-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredCourses.map(course => (
                              <tr key={course.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 pl-4 font-medium text-white">{course.title}</td>
                                <td className="py-4 text-text-secondary">
                                  <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                                    {course.category}
                                  </span>
                                </td>
                                <td className="py-4 text-text-secondary">${course.price}</td>
                                <td className="py-4 text-text-secondary">{course.purchaseCount || 0}</td>
                                <td className="py-4 text-green-400 font-medium">${course.revenue?.toFixed(2) || '0.00'}</td>
                                <td className="py-4 text-right pr-4">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => navigate(`/courses/${course.id}?edit=true`)}
                                      size="sm"
                                      className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 h-8"
                                    >
                                      <Edit className="w-3 h-3 mr-1" /> Edit
                                    </Button>

                                    {deleteConfirm === course.id ? (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          onClick={() => handleDeleteCourse(course.id)}
                                          size="sm"
                                          className="bg-red-500 hover:bg-red-600 text-white h-8"
                                        >
                                          Confirm
                                        </Button>
                                        <Button
                                          onClick={() => setDeleteConfirm(null)}
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() => setDeleteConfirm(course.id)}
                                        size="sm"
                                        variant="destructive"
                                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 h-8"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBSCRIPTIONS TAB */}
                {activeTab === 'subscriptions' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white">Subscription Plans ({subscriptionPlans.length})</h2>
                      {!showPlanForm && !editingPlan && (
                        <Button
                          onClick={() => setShowPlanForm(true)}
                          className="bg-primary hover:bg-opacity-90 text-white btn-glow"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Create New Plan
                        </Button>
                      )}
                    </div>

                    {showPlanForm && (
                      <SubscriptionPlanForm
                        onSubmit={handleCreatePlan}
                        onCancel={() => setShowPlanForm(false)}
                      />
                    )}

                    {editingPlan && (
                      <SubscriptionPlanForm
                        plan={editingPlan}
                        onSubmit={handleUpdatePlan}
                        onCancel={() => setEditingPlan(null)}
                      />
                    )}

                    {!showPlanForm && !editingPlan && (
                      <>
                        {loading ? (
                          <div className="text-center py-12 text-text-secondary">Loading plans...</div>
                        ) : subscriptionPlans.length === 0 ? (
                          <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                            <p className="text-text-secondary mb-4">No subscription plans yet. Create your first plan!</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subscriptionPlans.map(plan => (
                              <div
                                key={plan.id}
                                className="bg-bg-tertiary border border-white/10 rounded-xl p-6 hover-lift relative"
                              >
                                {!plan.is_active && (
                                  <div className="absolute top-3 right-3">
                                    <span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-full border border-gray-500/20">
                                      Inactive
                                    </span>
                                  </div>
                                )}
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-text-muted text-sm mb-4">{plan.description}</p>
                                <div className="mb-4">
                                  <span className="text-3xl font-bold text-primary">${plan.price}</span>
                                  <span className="text-text-secondary"> / {plan.billing_period}</span>
                                </div>
                                {plan.features && plan.features.length > 0 && (
                                  <ul className="space-y-2 mb-6">
                                    {plan.features.slice(0, 3).map((feature, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-text-secondary text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                        {feature}
                                      </li>
                                    ))}
                                    {plan.features.length > 3 && (
                                      <li className="text-text-muted text-xs">
                                        +{plan.features.length - 3} more features
                                      </li>
                                    )}
                                  </ul>
                                )}
                                <div className="flex gap-2 pt-4 border-t border-white/10">
                                  <Button
                                    onClick={() => setEditingPlan(plan)}
                                    size="sm"
                                    className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20"
                                  >
                                    <Edit className="w-3 h-3 mr-1" /> Edit
                                  </Button>
                                  {deleteConfirm === plan.id ? (
                                    <>
                                      <Button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        size="sm"
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                      >
                                        Confirm
                                      </Button>
                                      <Button
                                        onClick={() => setDeleteConfirm(null)}
                                        size="sm"
                                        variant="ghost"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      onClick={() => setDeleteConfirm(plan.id)}
                                      size="sm"
                                      variant="destructive"
                                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white">All Users ({users.length})</h2>
                    </div>

                    {loading ? (
                      <div className="text-center py-12 text-text-secondary">Loading users...</div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-text-secondary">No users found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/10 text-text-secondary text-sm">
                              <th className="pb-4 pl-4">Email</th>
                              <th className="pb-4">Role</th>
                              <th className="pb-4">Subscription</th>
                              <th className="pb-4">Joined</th>
                              <th className="pb-4 text-right pr-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {users.map(user => (
                              <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 pl-4 text-white">
                                  {user.email || 'Unknown Email'}
                                  <div className="text-xs text-text-muted font-mono mt-0.5">{user.user_id}</div>
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs border flex w-fit items-center gap-1 ${user.role === 'admin'
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}>
                                    {user.role === 'admin' ? <ShieldAlert className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                    {user.role.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-4">
                                  {user.hasActiveSubscription ? (
                                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                                      {user.subscriptionPlan || 'Active'}
                                    </span>
                                  ) : (
                                    <span className="text-text-muted text-xs">None</span>
                                  )}
                                </td>
                                <td className="py-4 text-text-secondary">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-right pr-4">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => setSelectedUser(user)}
                                      size="sm"
                                      className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 h-8"
                                    >
                                      <Eye className="w-3 h-3 mr-1" /> View
                                    </Button>
                                    {deleteUserConfirm === user.user_id ? (
                                      <>
                                        <Button
                                          onClick={() => handleDeleteUser(user.user_id)}
                                          size="sm"
                                          className="bg-red-500 hover:bg-red-600 text-white h-8"
                                        >
                                          Confirm
                                        </Button>
                                        <Button
                                          onClick={() => setDeleteUserConfirm(null)}
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        onClick={() => setDeleteUserConfirm(user.user_id)}
                                        size="sm"
                                        variant="destructive"
                                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 h-8"
                                      >
                                        <UserX className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* PURCHASE HISTORY TAB */}
                {activeTab === 'purchases' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white">Purchase History ({purchases.length})</h2>
                    </div>

                    {loading ? (
                      <div className="text-center py-12 text-text-secondary">Loading purchase history...</div>
                    ) : purchases.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                        <p className="text-text-secondary">No purchases found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/10 text-text-secondary text-sm">
                              <th className="pb-4 pl-4">Date</th>
                              <th className="pb-4">Course</th>
                              <th className="pb-4">Amount</th>
                              <th className="pb-4">Username</th>
                              <th className="pb-4">Email</th>
                              <th className="pb-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {purchases.map(purchase => (
                              <tr key={purchase.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 pl-4 text-text-secondary">
                                  {new Date(purchase.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                  <div className="text-xs text-text-muted">
                                    {new Date(purchase.date).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                                <td className="py-4 text-white font-medium">
                                  {purchase.courseName}
                                </td>
                                <td className="py-4 text-green-400 font-semibold">
                                  ${parseFloat(purchase.amount).toFixed(2)}
                                  <span className="text-xs text-text-muted ml-1">
                                    {purchase.currency}
                                  </span>
                                </td>
                                <td className="py-4 text-text-secondary">
                                  {purchase.username}
                                </td>
                                <td className="py-4 text-text-secondary">
                                  {purchase.email}
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs border ${purchase.status === 'completed'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    {purchase.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          </div>
        </main>
      </div>

      {/* User Edit Modal */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => {
            fetchUsers();
            setSelectedUser(null);
          }}
        />
      )}
    </>
  );
};

export default AdminCenter;
