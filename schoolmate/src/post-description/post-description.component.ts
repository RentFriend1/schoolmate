import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, deleteDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-post-description',
  templateUrl: './post-description.component.html',
  styleUrls: ['./post-description.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PostDescriptionComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  post: any = null;
  responseText: string = '';
  editingPostId: string | null = null;
  selectedResponse: string | null = null;
  initialResponseVotes: { [key: string]: number } = {};

  // Carousel property to track the currently visible image
  currentImageIndex: number = 0;

  constructor(private route: ActivatedRoute) { }

  async ngOnInit() {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      const postDoc = await getDoc(doc(this.firestore, 'posts', postId));
      if (postDoc.exists()) {
        this.post = { id: postDoc.id, ...postDoc.data() };

        // Initialize carousel index
        this.currentImageIndex = 0;

        // Store initial votes for each response
        this.post['responses'].forEach((response: any) => {
          this.initialResponseVotes[response.id] = response.votes || 0;
          response.votedBy = response.votedBy || {}; // Ensure votedBy is initialized
        });

        // Sort responses by votes in descending order
        this.post['responses'].sort((a: any, b: any) => b.votes - a.votes);
      }
    }
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  async addResponse() {
    const currentUser = this.auth.currentUser;
    if (currentUser && this.post) {
      const response = {
        id: uuidv4(),
        text: this.responseText,
        author: currentUser.displayName,
        authorId: currentUser.uid,
        createdAt: new Date(),
        votes: 0,
        votedBy: {} // Initialize votedBy
      };
      const postRef = doc(this.firestore, 'posts', this.post.id);
      await updateDoc(postRef, {
        responses: arrayUnion(response)
      });
      if (!this.post['responses']) {
        this.post['responses'] = [];
      }
      this.post['responses'].push(response);
      this.responseText = '';

      // Sort responses by votes in descending order
      this.post['responses'].sort((a: any, b: any) => b.votes - a.votes);
    } else {
      console.warn('No authenticated user found.');
    }
  }

  async deleteResponse(response: any) {
    if (this.post) {
      const postRef = doc(this.firestore, 'posts', this.post.id);
      await updateDoc(postRef, {
        responses: arrayRemove(response)
      });
      this.post['responses'] = this.post['responses'].filter((r: any) => r !== response);
    }
  }

  startEditing() {
    const currentUser = this.auth.currentUser;
    if (currentUser && this.post && this.post.authorId === currentUser.uid) {
      this.editingPostId = this.post.id;
    } else {
      console.warn('You are not authorized to edit this post.');
    }
  }

  async updatePost() {
    if (this.editingPostId) {
      const postRef = doc(this.firestore, 'posts', this.editingPostId);
      await updateDoc(postRef, {
        title: this.post.title,
        category: this.post.category,
        description: this.post.description,
        editedAt: serverTimestamp()
      });
      this.editingPostId = null;
    }
  }

  async deletePost() {
    const currentUser = this.auth.currentUser;
    if (currentUser && this.post && this.post.authorId === currentUser.uid) {
      const postRef = doc(this.firestore, 'posts', this.post.id);
      await deleteDoc(postRef);
      this.router.navigate(['/homepage']); // Redirect to homepage after deletion
    } else {
      console.warn('You are not authorized to delete this post.');
    }
  }

  selectResponse(responseId: string) {
    this.selectedResponse = responseId;
  }

  async voteResponse(postId: string, responseId: string, voteType: 'upvote' | 'downvote') {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      console.warn('No authenticated user found.');
      return;
    }

    const postRef = doc(this.firestore, 'posts', postId);
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      const post = postDoc.data();
      const response = post['responses'].find((r: any) => r.id === responseId);
      if (response) {
        response.votedBy = response.votedBy || {}; // Ensure votedBy is initialized
        const userVote = response.votedBy[currentUser.uid];
        let newVotes = response.votes || 0;

        if (voteType === 'upvote') {
          if (userVote === 'upvote') {
            // User is removing their upvote, reset to initial votes
            newVotes = this.initialResponseVotes[response.id];
            delete response.votedBy[currentUser.uid];
          } else {
            // User is adding an upvote or changing from downvote to upvote
            newVotes += userVote === 'downvote' ? 2 : 1;
            response.votedBy[currentUser.uid] = 'upvote';
          }
        } else if (voteType === 'downvote') {
          if (userVote === 'downvote') {
            // User is removing their downvote, reset to initial votes
            newVotes = this.initialResponseVotes[response.id];
            delete response.votedBy[currentUser.uid];
          } else {
            // User is adding a downvote or changing from upvote to downvote
            newVotes += userVote === 'upvote' ? -2 : -1;
            response.votedBy[currentUser.uid] = 'downvote';
          }
        }

        response.votes = newVotes;
        await updateDoc(postRef, { responses: post['responses'] });

        // Update the local state to reflect the changes
        const localResponse = this.post['responses'].find((r: any) => r.id === responseId);
        if (localResponse) {
          localResponse.votes = newVotes;
          localResponse.votedBy = response.votedBy;
        }

        // Sort responses by votes in descending order
        this.post['responses'].sort((a: any, b: any) => b.votes - a.votes);
      }
    }
  }

  // Updated methods for image carousel navigation with debugging

  prevImage() {
    if (this.post && this.post.images && this.post.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.post.images.length) % this.post.images.length;
      console.log('prevImage: new index=', this.currentImageIndex);
    }
  }

  nextImage() {
    if (this.post && this.post.images && this.post.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.post.images.length;
      console.log('nextImage: new index=', this.currentImageIndex);
    }
  }
}
