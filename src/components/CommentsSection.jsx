import { useState, useEffect } from 'react';
import { MessageCircle, Send, ThumbsUp, Flag, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CommentsSection({ contentId, contentType }) {
  const { user, isPremium } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [contentId]);

  const loadComments = async () => {
    try {
      const data = await api.getComments(contentId, contentType);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isPremium) return;

    setLoading(true);
    try {
      await api.addComment(contentId, contentType, newComment);
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId) => {
    try {
      await api.likeComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleReport = async (commentId) => {
    try {
      await api.reportComment(commentId);
      alert('Commentaire signalé');
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    try {
      await api.deleteComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircle size={24} />
        Commentaires ({comments.length})
      </h3>

      {!isPremium && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          textAlign: 'center',
        }}>
          <p style={{ color: '#94a3b8', marginBottom: '12px' }}>
            Les commentaires sont réservés aux membres Premium
          </p>
          <a
            href="/subscribe"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Passer Premium
          </a>
        </div>
      )}

      {isPremium && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Partagez votre avis..."
              maxLength={500}
              style={{
                width: '100%',
                minHeight: '100px',
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {newComment.length}/500
              </span>
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                style={{
                  background: loading || !newComment.trim() ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  cursor: loading || !newComment.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={16} />
                Publier
              </button>
            </div>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
            Aucun commentaire pour le moment
          </p>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              style={{
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '700',
                  }}>
                    {comment.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '2px' }}>{comment.username}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {user?.id === comment.userId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleReport(comment.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Flag size={16} />
                  </button>
                </div>
              </div>
              <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '12px' }}>
                {comment.text}
              </p>
              <button
                onClick={() => handleLike(comment.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: comment.likedByUser ? '#8b5cf6' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <ThumbsUp size={16} fill={comment.likedByUser ? '#8b5cf6' : 'none'} />
                {comment.likes || 0}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
