// HeroSection.tsx - Chakra UI v3 그라데이션 수정
import React, { useState } from "react";
import { Box, Text, Input, IconButton, Container, Flex } from "@chakra-ui/react";
import {Search, X} from "lucide-react";
import useHeroSection from "./useHeroSection";
import SearchDropdown from "./HomeSearch/SearchDropdown";

function HeroSection() {
  const {
    searchInfoQuery,
    handleSearchChange,
    isDropdownOpen,
    setIsDropdownOpen,
    documents,
    isLoading,
    error,
    dropdownRef,
    searchInputRef,
    handleKeyDown,
  } = useHeroSection();
  
  
  return (
    <Box
      w={"100%"}
      // maxW={"7xl"}
      display="flex"
      justifyContent="center"
      // padding={"0 1.5rem"}
    >
    <Box
      position="relative"
      color="white"
      w={"100%"}
      // maxW="7xl"
      px={{ base: 0, md : 6}}
      py={12}
      // Chakra v3에서는 style prop 직접 사용
      style={{
        background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)'
      }}
    >
      {/* 한국 전통 문양 배경 패턴 */}
      <Box
        position="absolute"
        inset={0}
        opacity={0.15}
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            )
          `,
        }}
      />
      
      <Box
        position="absolute"
        bottom="-150px"
        left="-150px"
        width="400px"
        height="400px"
        borderRadius="full"
        opacity={0.15}
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)'
        }}
      />
      
      <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} position="relative" zIndex={1}>
        <Box textAlign="center">
          <Text
            fontSize={{ base: "3xl", md: "5xl" }}
            fontWeight="bold"
            mb={4}
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            Welcome to Nadeliv
          </Text>
          
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            mb={8}
            opacity={0.95}
            maxW="600px"
            mx="auto"
          >
            Your companion for finding, planning, and keeping every trip
          </Text>
          
          {/* Search Bar */}
          <Box ref={dropdownRef} maxW="2xl" mx="auto" position="relative">
            <Input
              ref={searchInputRef}
              placeholder="Search destinations, tips, or experiences..."
              value={searchInfoQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => Number(searchInfoQuery?.length) >= 2 && setIsDropdownOpen(true)}
              bg="white"
              color="gray.800"
              borderRadius="full"
              size="lg"
              height="60px"
              px={6}
              pr={searchInfoQuery ? 24 : 16}
              fontSize="md"
              style={{
                boxShadow: isDropdownOpen
                  ? '0 10px 40px rgba(0,0,0,0.3)'
                  : '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'box-shadow 0.2s'
              }}
              _placeholder={{ color: "gray.400" }}
              _focus={{
                outline: "none",
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
              }}
            />
            {searchInfoQuery && (
              <IconButton
                aria-label="Clear search"
                borderRadius="full"
                position="absolute"
                right="60px"
                top="50%"
                size="sm"
                height="32px"
                width="32px"
                bg="transparent"
                color="gray.500"
                style={{
                  transform: 'translateY(-50%)',
                }}
                _hover={{
                  bg: "gray.100",
                  color: "gray.700"
                }}
                onClick={() => {
                  handleSearchChange("");
                  searchInputRef.current?.focus();
                }}
              >
                <X size={18} />
              </IconButton>
            )}
            {/* Search Results Dropdown */}
            <SearchDropdown
              documents={documents}
              isLoading={isLoading}
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              searchInfoQuery={searchInfoQuery}
            />
          </Box>
          {/* Popular Search Tags */}
          <Flex
            gap={3}
            justify="center"
            mt={8}
            flexWrap="wrap"
            px={4}
          >
            <Text
              fontSize="sm"
              color="whiteAlpha.800"
              mr={2}
            >
              Popular:
            </Text>
            {['Seoul Tower', 'Bukchon Hanok', 'Jeju Island', 'Korean BBQ', 'Temple Stay'].map((tag) => (
              <Box
                key={tag}
                as="button"
                px={3}
                py={1.5}
                borderRadius="full"
                fontSize="sm"
                fontWeight="medium"
                transition="all 0.2s"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.25)'
                }}
                _hover={{
                  bg: "whiteAlpha.300",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
                onClick={() => {
                  handleSearchChange(tag);
                  searchInputRef.current?.focus();
                }}
              >
                {tag}
              </Box>
            ))}
          </Flex>
        </Box>
      </Container>
    </Box>
    </Box>
  );
}

export default HeroSection;