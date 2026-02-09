
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Edit } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { isAdmin } = useAdmin();

  const handleViewCourse = () => {
    navigate(`/courses/${course.id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/courses/${course.id}?edit=true`);
  };

  const difficultyColors = {
    Beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    Intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <div
      className="glass-card rounded-xl overflow-hidden hover-lift cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewCourse}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />

        {isHovered && isAdmin && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center fade-in">
            <Button
              onClick={handleEdit}
              className="bg-primary hover:bg-opacity-90 text-white btn-glow flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="card-spacing">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColors[course.difficulty] || difficultyColors.Beginner}`}>
            {course.difficulty}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
            {course.category}
          </span>
        </div>

        <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-1">
          {course.title}
        </h3>

        <p className="text-text-secondary text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-text-muted text-sm mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.lessonsCount} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold gradient-text">
            €{course.price}
          </span>
          <Button
            onClick={handleViewCourse}
            className="bg-[#ffc439] hover:bg-[#f2ba36] text-[#003087] font-bold shadow-lg transition-fast hover:scale-102"
          >
            View Course
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
