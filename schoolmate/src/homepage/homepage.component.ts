import { Component, OnInit, inject } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { RouterModule } from '@angular/router'; // Import RouterModule
import { v4 as uuidv4 } from 'uuid'; // Import UUID library

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Add RouterModule to imports
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  postTitle: string = '';
  postCategory: string = '';
  postDescription: string = '';
  responseText: { [key: string]: string } = {}; // Store response text for each post
  posts: any[] = [];
  editingPostId: string | null = null;
  selectedResponse: { [key: string]: string | null } = {}; // Add property to track selected response for each post

  async ngOnInit() {
    await this.loadPosts(); // Ensure loadPosts is called when the component initializes
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  async createPost() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      const post = {
        title: this.postTitle,
        category: this.postCategory,
        description: this.postDescription,
        author: currentUser.displayName,
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
        responses: [],
        votes: 0, // Initialize votes
        votedBy: {} // Initialize votedBy
      };
      const docRef = await addDoc(collection(this.firestore, 'posts'), post);
      this.posts.push({ id: docRef.id, ...post, createdAt: new Date() });
      this.postTitle = '';
      this.postCategory = '';
      this.postDescription = '';
    } else {
      console.warn('No authenticated user found.');
    }
  }

  async loadPosts() {
    const querySnapshot = await getDocs(collection(this.firestore, 'posts'));
    this.posts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data['createdAt'] ? (data['createdAt'].toDate ? data['createdAt'].toDate() : new Date(data['createdAt'])) : null,
        editedAt: data['editedAt'] ? (data['editedAt'].toDate ? data['editedAt'].toDate() : new Date(data['editedAt'])) : null,
        votes: data['votes'] || 0, // Ensure votes is initialized
        votedBy: data['votedBy'] || {} // Ensure votedBy is initialized
      };
    });

    // Sort posts by votes in descending order
    this.posts.sort((a, b) => b.votes - a.votes);
  }

  async deletePost(postId: string) {
    const currentUser = this.auth.currentUser;
    const post = this.posts.find(post => post.id === postId);

    if (currentUser && post && post.authorId === currentUser.uid) {
      await deleteDoc(doc(this.firestore, 'posts', postId));
      this.posts = this.posts.filter(post => post.id !== postId);
    } else {
      console.warn('You are not authorized to delete this post.');
    }
  }

  async updatePost() {
    if (this.editingPostId) {
      const postRef = doc(this.firestore, 'posts', this.editingPostId);
      await updateDoc(postRef, {
        title: this.postTitle,
        category: this.postCategory,
        description: this.postDescription,
        editedAt: serverTimestamp() // Add editedAt field
      });
      const updatedPost = this.posts.find(post => post.id === this.editingPostId);
      if (updatedPost) {
        updatedPost.title = this.postTitle;
        updatedPost.category = this.postCategory;
        updatedPost.description = this.postDescription;
        updatedPost.editedAt = new Date(); // Update the local post object
      }
      this.editingPostId = null;
      this.postTitle = '';
      this.postCategory = '';
      this.postDescription = '';
    }
  }

  async addResponse(postId: string) {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      const response = {
        id: uuidv4(), // Generate a unique ID for the response
        text: this.responseText[postId],
        author: currentUser.displayName,
        authorId: currentUser.uid, // Add authorId field
        createdAt: new Date() // Set createdAt separately
      };
      const postRef = doc(this.firestore, 'posts', postId);
      await updateDoc(postRef, {
        responses: arrayUnion(response)
      });
      const post = this.posts.find(post => post.id === postId);
      if (post) {
        if (!post.responses) {
          post.responses = [];
        }
        post.responses.push(response);
      }
      this.responseText[postId] = ''; // Clear the response text for the specific post
    } else {
      console.warn('No authenticated user found.');
    }
  }

  async deleteResponse(postId: string, response: any) {
    const postRef = doc(this.firestore, 'posts', postId);
    await updateDoc(postRef, {
      responses: arrayRemove(response)
    });
    const post = this.posts.find(post => post.id === postId);
    if (post) {
      post.responses = post.responses.filter((r: any) => r !== response);
    }
  }

  startEditing(post: any) {
    const currentUser = this.auth.currentUser;
    if (currentUser && post.authorId === currentUser.uid) {
      this.editingPostId = post.id;
      this.postTitle = post.title;
      this.postCategory = post.category;
      this.postDescription = post.description;
    } else {
      console.warn('You are not authorized to edit this post.');
    }
  }

  selectResponse(postId: string, responseId: string) {
    this.selectedResponse[postId] = responseId;
  }

  getFirstThreeResponses(responses: any[]): any[] {
    return responses.slice(0, 3);
  }

  async votePost(postId: string, voteType: 'upvote' | 'downvote') {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      console.warn('No authenticated user found.');
      return;
    }

    const postRef = doc(this.firestore, 'posts', postId);
    const post = this.posts.find(post => post.id === postId);
    if (post) {
      const userVote = post.votedBy[currentUser.uid];
      let newVotes = post.votes || 0;

      if (voteType === 'upvote') {
        if (userVote !== 'upvote') {
          // User is adding an upvote or changing from downvote to upvote
          newVotes += userVote === 'downvote' ? 2 : 1;
          post.votedBy[currentUser.uid] = 'upvote';
        }
      } else if (voteType === 'downvote') {
        if (userVote !== 'downvote') {
          // User is adding a downvote or changing from upvote to downvote
          newVotes += userVote === 'upvote' ? -2 : -1;
          post.votedBy[currentUser.uid] = 'downvote';
        }
      }

      await updateDoc(postRef, { votes: newVotes, votedBy: post.votedBy });
      post.votes = newVotes;

      // Re-sort posts after voting
      this.posts.sort((a, b) => b.votes - a.votes);
    }
  }
}
