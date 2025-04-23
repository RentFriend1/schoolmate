import { Component, OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private storage = getStorage();

  postTitle: string = '';
  postCategory: string = '';
  postDescription: string = '';
  selectedFiles: File[] = [];
  responseText: { [key: string]: string } = {};
  posts: any[] = [];
  editingPostId: string | null = null;
  selectedResponse: { [key: string]: string | null } = {};
  initialVotes: { [key: string]: number } = {};

  async ngOnInit() {
    await this.loadPosts();
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  async uploadImage(file: File): Promise<string> {
    const storageRef = ref(this.storage, `posts/${uuidv4()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  async createPost() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      const imageUrls: string[] = [];
      for (const file of this.selectedFiles) {
        const imageUrl = await this.uploadImage(file);
        imageUrls.push(imageUrl);
      }

      const post = {
        title: this.postTitle,
        category: this.postCategory,
        description: this.postDescription,
        author: currentUser.displayName,
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
        responses: [],
        votes: 0,
        votedBy: {},
        images: imageUrls
      };

      const docRef = await addDoc(collection(this.firestore, 'posts'), post);
      this.posts.push({ id: docRef.id, ...post, createdAt: new Date() });
      this.postTitle = '';
      this.postCategory = '';
      this.postDescription = '';
      this.selectedFiles = [];
    } else {
      console.warn('No authenticated user found.');
    }
  }

  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
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
        votes: data['votes'] || 0,
        votedBy: data['votedBy'] || {}
      };
    });

    this.posts.forEach(post => {
      this.initialVotes[post.id] = post.votes;
    });

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
        editedAt: serverTimestamp()
      });
      const updatedPost = this.posts.find(post => post.id === this.editingPostId);
      if (updatedPost) {
        updatedPost.title = this.postTitle;
        updatedPost.category = this.postCategory;
        updatedPost.description = this.postDescription;
        updatedPost.editedAt = new Date();
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
        id: uuidv4(),
        text: this.responseText[postId],
        author: currentUser.displayName,
        authorId: currentUser.uid,
        createdAt: new Date()
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
      this.responseText[postId] = '';
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
        if (userVote === 'upvote') {
          newVotes = this.initialVotes[post.id];
          delete post.votedBy[currentUser.uid];
        } else {
          newVotes += userVote === 'downvote' ? 2 : 1;
          post.votedBy[currentUser.uid] = 'upvote';
        }
      } else if (voteType === 'downvote') {
        if (userVote === 'downvote') {
          newVotes = this.initialVotes[post.id];
          delete post.votedBy[currentUser.uid];
        } else {
          newVotes += userVote === 'upvote' ? -2 : -1;
          post.votedBy[currentUser.uid] = 'downvote';
        }
      }

      await updateDoc(postRef, { votes: newVotes, votedBy: post.votedBy });
      post.votes = newVotes;

      this.posts.sort((a, b) => b.votes - a.votes);
    }
  }
}
