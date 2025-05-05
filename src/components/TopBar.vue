<template>
  <div class="topbar">
    <p>Kirara AI</p>
    <!-- <ul>
      <li><a href="#">Home</a></li>
      <li><a href="#">About</a></li>
      <li><a href="#">Contact</a></li>
    </ul> -->
  </div>
</template>

<script>
export default {
  name: 'TopBar'
}
</script>

<style scoped>
.topbar {
  background-color: #333;
  color: #fff;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo {
  height: 40px;
}

ul {
  list-style: none;
  display: flex;
}

li {
  margin-right: 20px;
}

a {
  color: #fff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
